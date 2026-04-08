import { api } from './client';

export type ApplicationStage = 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';

export type CandidateApplication = {
  id: string;
  job_id: string;
  job_title: string;
  company_name: string | null;
  stage: string;
  cv_similarity_score: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CvScorePreview = {
  job_id: string;
  predicted_fit: 'bad' | 'medium' | 'good';
  ranking_score: number;
  prob_good: number;
  prob_medium: number;
  prob_bad: number;
  lexical_similarity: number;
  scorer_source: string;
};

export type CvExtractResult = {
  cv_text: string;
  file_format: string;
};

export async function listCandidateApplications() {
  const { data } = await api.get<CandidateApplication[]>('/candidate/applications');
  return data;
}

/** Server-side text extraction from PDF, DOCX, or TXT (candidate auth). */
export async function extractCvText(file: File) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<CvExtractResult>('/candidate/cv/extract', form);
  return data;
}

export async function applyToJob(jobId: string, opts?: { cvText?: string }) {
  const body =
    opts?.cvText != null && opts.cvText.trim() !== ''
      ? { cv_text: opts.cvText.trim() }
      : {};
  const { data } = await api.post<CandidateApplication>(`/jobs/${jobId}/apply`, body);
  return data;
}

export async function scoreCvForJob(jobId: string, cvText: string) {
  const { data } = await api.post<CvScorePreview>(`/jobs/${jobId}/score-cv`, {
    cv_text: cvText.trim(),
  });
  return data;
}
