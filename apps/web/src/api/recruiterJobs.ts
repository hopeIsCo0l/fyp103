import { api } from './client';

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship';
export type JobStatus = 'draft' | 'open' | 'paused' | 'closed';

/** SRS FR-01: CV / exam / interview weights (sum 1.0) when set */
export type CriteriaWeights = {
  cv: number;
  exam: number;
  interview: number;
};

export type JobOut = {
  id: string;
  title: string;
  description: string;
  company_name: string | null;
  location: string | null;
  employment_type: EmploymentType;
  status: JobStatus;
  criteria_weights: CriteriaWeights | null;
  created_by: string;
  created_at: string | null;
  updated_at: string | null;
  applicants_count: number;
};

export type JobListResponse = {
  items: JobOut[];
  total: number;
};

export type JobCreateBody = {
  title: string;
  description?: string;
  company_name?: string | null;
  location?: string | null;
  employment_type?: EmploymentType;
  status?: JobStatus;
  criteria_weights?: CriteriaWeights;
};

export type JobUpdateBody = Partial<{
  title: string;
  description: string;
  company_name: string | null;
  location: string | null;
  employment_type: EmploymentType;
  status: JobStatus;
  criteria_weights: CriteriaWeights | null;
}>;

export async function listRecruiterJobs(params?: { status?: string; search?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.search) searchParams.set('search', params.search);
  const q = searchParams.toString();
  const { data } = await api.get<JobListResponse>(`/recruiter/jobs${q ? `?${q}` : ''}`);
  return data;
}

export async function createRecruiterJob(body: JobCreateBody) {
  const { data } = await api.post<JobOut>('/recruiter/jobs', body);
  return data;
}

export async function updateRecruiterJob(jobId: string, body: JobUpdateBody) {
  const { data } = await api.patch<JobOut>(`/recruiter/jobs/${jobId}`, body);
  return data;
}

export async function deleteRecruiterJob(jobId: string) {
  await api.delete(`/recruiter/jobs/${jobId}`);
}
