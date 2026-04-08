import { api } from './client';
import type { ApplicationStage } from './applications';

export type RecruiterApplication = {
  id: string;
  job_id: string;
  job_title: string;
  candidate_id: string;
  candidate_email: string;
  candidate_name: string;
  candidate_profile: RecruiterCandidateProfile;
  stage: string;
  cv_similarity_score: number | null;
  weighted_total_score?: number | null;
  score_breakdown?: Record<string, number> | null;
  created_at: string | null;
  updated_at: string | null;
};

export type RecruiterCandidateProfile = {
  phone: string | null;
  profile_completed: boolean;
  profile_completion_skipped: boolean;
  birth_date: string | null;
  country: string | null;
  city: string | null;
  subcity: string | null;
  address_line: string | null;
  education_level: string | null;
  high_school_name: string | null;
  high_school_completion_year: number | null;
  higher_education_institution: string | null;
  higher_education_level: string | null;
  field_of_study: string | null;
  graduation_year: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  bmi: number | null;
  skills_summary: string | null;
  experience_summary: string | null;
};

export async function listAllRecruiterApplications() {
  const { data } = await api.get<RecruiterApplication[]>('/recruiter/applications');
  return data;
}

export async function listJobApplications(jobId: string) {
  const { data } = await api.get<RecruiterApplication[]>(`/recruiter/jobs/${jobId}/applications`);
  return data;
}

export async function updateApplicationStage(applicationId: string, stage: ApplicationStage) {
  const { data } = await api.patch<RecruiterApplication>(`/recruiter/applications/${applicationId}`, {
    stage,
  });
  return data;
}
