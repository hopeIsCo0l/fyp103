import { api } from './client';

export type ApplicationStage = 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';

export type CandidateApplication = {
  id: string;
  job_id: string;
  job_title: string;
  company_name: string | null;
  stage: string;
  created_at: string | null;
  updated_at: string | null;
};

export async function listCandidateApplications() {
  const { data } = await api.get<CandidateApplication[]>('/candidate/applications');
  return data;
}

export async function applyToJob(jobId: string) {
  const { data } = await api.post<CandidateApplication>(`/jobs/${jobId}/apply`);
  return data;
}
