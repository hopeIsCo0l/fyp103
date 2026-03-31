import { api } from './client';

/** Open jobs for candidate browse (no auth required; same-origin /api). */
export type PublicJob = {
  id: string;
  title: string;
  description: string;
  company_name: string | null;
  location: string | null;
  employment_type: string;
  created_at: string | null;
};

export type PublicJobListResponse = {
  items: PublicJob[];
  total: number;
  page: number;
  size: number;
};

export async function listOpenJobs(params?: {
  search?: string;
  employment_type?: string;
  location?: string;
  page?: number;
  size?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set('search', params.search);
  if (params?.employment_type) sp.set('employment_type', params.employment_type);
  if (params?.location) sp.set('location', params.location);
  if (params?.page != null) sp.set('page', String(params.page));
  if (params?.size != null) sp.set('size', String(params.size));
  const q = sp.toString();
  const { data } = await api.get<PublicJobListResponse>(`/jobs${q ? `?${q}` : ''}`);
  return data;
}

export async function getOpenJob(jobId: string) {
  const { data } = await api.get<PublicJob>(`/jobs/${jobId}`);
  return data;
}
