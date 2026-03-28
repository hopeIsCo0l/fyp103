/** Placeholder data until job/application APIs exist. */

export type MockJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full_time' | 'contract' | 'part_time';
  postedAt: string;
  matchPct: number;
};

export type MockApplication = {
  id: string;
  jobTitle: string;
  company: string;
  stage: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';
  updatedAt: string;
};

export type MockRecruiterJob = {
  id: string;
  title: string;
  applicants: number;
  status: 'open' | 'paused' | 'closed';
  postedAt: string;
};

export type MockPipelineRow = {
  id: string;
  candidateName: string;
  jobTitle: string;
  stage: 'new' | 'screening' | 'interview' | 'offer';
  updatedAt: string;
};

export const MOCK_JOBS: MockJob[] = [
  {
    id: 'j1',
    title: 'Senior Frontend Engineer',
    company: 'Northwind Labs',
    location: 'Remote · EU',
    type: 'full_time',
    postedAt: '2026-03-26',
    matchPct: 94,
  },
  {
    id: 'j2',
    title: 'Product Designer',
    company: 'Blue River',
    location: 'Addis Ababa · Hybrid',
    type: 'full_time',
    postedAt: '2026-03-24',
    matchPct: 88,
  },
  {
    id: 'j3',
    title: 'ML Engineer (NLP)',
    company: 'Atlas AI',
    location: 'Remote',
    type: 'contract',
    postedAt: '2026-03-22',
    matchPct: 81,
  },
];

export const MOCK_APPLICATIONS: MockApplication[] = [
  {
    id: 'a1',
    jobTitle: 'Frontend Engineer',
    company: 'Kinetix',
    stage: 'interview',
    updatedAt: '2026-03-27',
  },
  {
    id: 'a2',
    jobTitle: 'UX Researcher',
    company: 'Helio',
    stage: 'screening',
    updatedAt: '2026-03-25',
  },
];

export const MOCK_RECRUITER_JOBS: MockRecruiterJob[] = [
  { id: 'rj1', title: 'Backend Developer', applicants: 12, status: 'open', postedAt: '2026-03-20' },
  { id: 'rj2', title: 'DevOps Engineer', applicants: 5, status: 'open', postedAt: '2026-03-18' },
  { id: 'rj3', title: 'HR Coordinator', applicants: 0, status: 'paused', postedAt: '2026-03-10' },
];

export const MOCK_PIPELINE: MockPipelineRow[] = [
  {
    id: 'p1',
    candidateName: 'Sara Hailu',
    jobTitle: 'Backend Developer',
    stage: 'interview',
    updatedAt: '2026-03-28',
  },
  {
    id: 'p2',
    candidateName: 'Daniel Tesfaye',
    jobTitle: 'Backend Developer',
    stage: 'screening',
    updatedAt: '2026-03-27',
  },
  {
    id: 'p3',
    candidateName: 'Meron Alem',
    jobTitle: 'DevOps Engineer',
    stage: 'new',
    updatedAt: '2026-03-26',
  },
];
