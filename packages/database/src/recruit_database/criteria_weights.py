"""Recruiter-defined weights for CV / exam / interview (SRS FR-01)."""

from pydantic import BaseModel, Field, model_validator


class CriteriaWeights(BaseModel):
    """Weights must sum to 1.0 (100%). Defaults match SRS example proportions."""

    cv: float = Field(default=0.40, ge=0.0, le=1.0, description="CV similarity weight")
    exam: float = Field(default=0.35, ge=0.0, le=1.0, description="Written exam weight")
    interview: float = Field(default=0.25, ge=0.0, le=1.0, description="Interview weight")

    @model_validator(mode="after")
    def weights_sum_to_one(self) -> "CriteriaWeights":
        total = self.cv + self.exam + self.interview
        if abs(total - 1.0) > 0.001:
            raise ValueError(f"criteria weights must sum to 1.0, got {total:.4f}")
        return self
