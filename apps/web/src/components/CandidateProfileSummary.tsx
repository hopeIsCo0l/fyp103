import { Chip, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { RecruiterCandidateProfile } from '../api/recruiterApplications';

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}

function joinParts(parts: Array<string | null | undefined>, separator = ', '): string | null {
  const filtered = parts.map((part) => part?.trim()).filter(Boolean) as string[];
  return filtered.length ? filtered.join(separator) : null;
}

export default function CandidateProfileSummary({
  profile,
}: {
  profile: RecruiterCandidateProfile;
}) {
  const { t } = useTranslation();

  const location = joinParts([profile.subcity, profile.city, profile.country]);
  const birthDate = formatDate(profile.birth_date);
  const school = joinParts(
    [
      profile.high_school_name,
      profile.high_school_completion_year ? String(profile.high_school_completion_year) : null,
    ],
    ' • '
  );
  const higherEducation = joinParts(
    [
      profile.higher_education_institution,
      profile.higher_education_level,
      profile.field_of_study,
      profile.graduation_year ? String(profile.graduation_year) : null,
    ],
    ' • '
  );
  const metrics = joinParts(
    [
      profile.height_cm != null ? `${t('recruit.profile.fields.heightCm')}: ${profile.height_cm}` : null,
      profile.weight_kg != null ? `${t('recruit.profile.fields.weightKg')}: ${profile.weight_kg}` : null,
      profile.bmi != null ? `${t('recruit.profile.fields.bmi')}: ${profile.bmi.toFixed(1)}` : null,
    ],
    ' • '
  );
  const statusKey = profile.profile_completed
    ? 'recruit.profile.statusComplete'
    : profile.profile_completion_skipped
      ? 'recruit.recruiter.profileStatusSkipped'
      : 'recruit.profile.statusIncomplete';
  const statusColor = profile.profile_completed
    ? 'success'
    : profile.profile_completion_skipped
      ? 'default'
      : 'warning';

  const hasAnyProfileData = Boolean(
    profile.phone ||
      location ||
      birthDate ||
      profile.education_level ||
      school ||
      higherEducation ||
      metrics ||
      profile.address_line ||
      profile.skills_summary ||
      profile.experience_summary
  );

  return (
    <Stack spacing={0.75}>
      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
        <Chip size="small" color={statusColor} label={t(statusKey)} />
        {location && <Chip size="small" variant="outlined" label={location} />}
        {profile.education_level && (
          <Chip size="small" variant="outlined" label={profile.education_level} />
        )}
      </Stack>

      {!hasAnyProfileData ? (
        <Typography variant="caption" color="text.secondary">
          {t('recruit.recruiter.profileSummaryEmpty')}
        </Typography>
      ) : (
        <>
          {profile.phone && (
            <Typography variant="caption" color="text.secondary">
              {t('signup.phone')}: {profile.phone}
            </Typography>
          )}
          {birthDate && (
            <Typography variant="caption" color="text.secondary">
              {t('recruit.profile.fields.birthDate')}: {birthDate}
            </Typography>
          )}
          {profile.address_line && (
            <Typography variant="caption" color="text.secondary">
              {t('recruit.profile.fields.addressLine')}: {profile.address_line}
            </Typography>
          )}
          {school && (
            <Typography variant="caption" color="text.secondary">
              {t('recruit.profile.fields.highSchoolName')}: {school}
            </Typography>
          )}
          {higherEducation && (
            <Typography variant="caption" color="text.secondary">
              {t('recruit.recruiter.higherEducationSummary')}: {higherEducation}
            </Typography>
          )}
          {metrics && (
            <Typography variant="caption" color="text.secondary">
              {metrics}
            </Typography>
          )}
          {profile.skills_summary && (
            <Typography
              variant="body2"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {t('recruit.profile.fields.skillsSummary')}: {profile.skills_summary}
            </Typography>
          )}
          {profile.experience_summary && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {t('recruit.profile.fields.experienceSummary')}: {profile.experience_summary}
            </Typography>
          )}
        </>
      )}
    </Stack>
  );
}
