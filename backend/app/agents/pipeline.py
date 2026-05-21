from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from app.agents.graph import eac_graph
from app.agents.llm_client import LLMClient, LLMResponse
from app.agents.state import EACAgentState
from app.config.settings import get_settings
from app.rules.accounting_rules import evaluate_record
from app.schemas.agent_schema import AgentStep, AgentTrace
from app.utils.confidence_scoring import derive_confidence

logger = logging.getLogger(__name__)
_llm = LLMClient()


@dataclass
class AgenticPipelineResult:
    record: Dict[str, Any]
    trace: AgentTrace


class AgenticPipeline:
    async def prefetch_llm(
        self,
        record: Dict[str, Any],
        source_type: str,
        semaphore: Optional[asyncio.Semaphore] = None,
    ) -> Dict[str, Any]:
        """Async-fetch the combined LLM analysis for one record, respecting the shared semaphore."""
        _sem = semaphore or asyncio.Semaphore(1)
        async with _sem:
            score, signals, _ = evaluate_record(record)
            conf = derive_confidence(score, signals, source_type)
            threshold = get_settings().llm_skip_threshold
            if threshold > 0 and conf >= threshold:
                return {"content": _llm._stub_combined(record), "provider": "stub", "model": "local-stub"}
            response = await _llm.analyze_record_async(record, signals)
            return {"content": response.content, "provider": response.provider, "model": response.model}

    def execute(self, record: Dict[str, Any], source_type: str, precomputed_llm: Optional[Dict[str, Any]] = None) -> AgenticPipelineResult:
        initial_state: EACAgentState = {
            "record": record,
            "source_type": source_type,
            "context": {},
            "retrieval_result": {},
            "policy_result": {},
            "classified_record": {},
            "routing_decision": "",
            "steps": [],
            "errors": [],
            "precomputed_llm": precomputed_llm or {},
        }

        try:
            final_state = eac_graph.invoke(initial_state)
        except Exception as exc:
            logger.exception("eac_graph.invoke failed: %s", exc)
            fallback = dict(record)
            fallback["_classification"] = "Review"
            fallback["_confidence"] = 0
            fallback["_evidence"] = f"Agent pipeline failed: {exc}"
            fallback["_reviewReason"] = "Pipeline exception — manual review required."
            fallback["_routingState"] = "review"
            error_step = AgentStep(
                agent="Pipeline",
                status="failed",
                summary=f"Graph invocation failed: {exc}",
                provider="error",
                output={},
            )
            trace = AgentTrace(provider="error", model="", steps=[error_step])
            fallback["_agentTrace"] = trace.model_dump() if hasattr(trace, "model_dump") else trace.dict()
            return AgenticPipelineResult(record=fallback, trace=trace)

        steps = [
            AgentStep(
                agent=s.get("agent", ""),
                status=s.get("status", "completed"),
                summary=s.get("summary", ""),
                provider=s.get("provider", ""),
                output=s.get("output", {}),
            )
            for s in final_state.get("steps", [])
        ]

        classified = final_state.get("classified_record", record)
        provider = next((s.get("provider", "") for s in final_state.get("steps", []) if s.get("provider") not in ("", "deterministic", "stub")), "stub")
        model = classified.get("_llmModel", "")

        trace = AgentTrace(provider=provider, model=model, steps=steps)
        # Write the assembled trace unless the node already set a non-null one
        if not classified.get("_agentTrace"):
            classified["_agentTrace"] = trace.model_dump() if hasattr(trace, "model_dump") else trace.dict()

        return AgenticPipelineResult(record=classified, trace=trace)
