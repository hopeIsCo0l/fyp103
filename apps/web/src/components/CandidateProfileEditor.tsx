import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { updateMe, type UpdateProfilePayload } from '../api/auth';
import { useAuth } from '../contexts/useAuth';
import { getApiErrorMessage } from '../utils/apiError';

interface CandidateProfileEditorProps {
  mode?: 'profile' | 'complete';
}

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;
const MAX_HEIGHT_CM = 300;
const MAX_WEIGHT_KG = 500;
function normalizeText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeFloat(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function isYearInRange(value: number | null): value is number {
  return value != null && value >= MIN_YEAR && value <= MAX_YEAR;
}

function isPositiveWithin(value: number | null, max: number): value is number {
  return value != null && value > 0 && value <= max;
}

function calculateBmi(heightCm: string, weightKg: string): number | null {
  const heightValue = normalizeFloat(heightCm);
  const weightValue = normalizeFloat(weightKg);
  if (!isPositiveWithin(heightValue, MAX_HEIGHT_CM) || !isPositiveWithin(weightValue, MAX_WEIGHT_KG)) {
    return null;
  }
  const height = heightValue;
  const weight = weightValue;
  const bmi = weight / (height / 100) ** 2;
  return Math.round(bmi * 10) / 10;
}

export default function CandidateProfileEditor({
  mode = 'profile',
}: CandidateProfileEditorProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [subcity, setSubcity] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [highSchoolName, setHighSchoolName] = useState('');
  const [highSchoolCompletionYear, setHighSchoolCompletionYear] = useState('');
  const [higherEducationInstitution, setHigherEducationInstitution] = useState('');
  const [higherEducationLevel, setHigherEducationLevel] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [skillsSummary, setSkillsSummary] = useState('');
  const [experienceSummary, setExperienceSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setFullName(user.full_name);
    setPhone(user.phone ?? '');
    setBirthDate(user.birth_date ?? '');
    setCountry(user.country ?? '');
    setCity(user.city ?? '');
    setSubcity(user.subcity ?? '');
    setAddressLine(user.address_line ?? '');
    setEducationLevel(user.education_level ?? '');
    setHighSchoolName(user.high_school_name ?? '');
    setHighSchoolCompletionYear(
      user.high_school_completion_year ? String(user.high_school_completion_year) : ''
    );
    setHigherEducationInstitution(user.higher_education_institution ?? '');
    setHigherEducationLevel(user.higher_education_level ?? '');
    setFieldOfStudy(user.field_of_study ?? '');
    setGraduationYear(user.graduation_year ? String(user.graduation_year) : '');
    setHeightCm(user.height_cm ? String(user.height_cm) : '');
    setWeightKg(user.weight_kg ? String(user.weight_kg) : '');
    setSkillsSummary(user.skills_summary ?? '');
    setExperienceSummary(user.experience_summary ?? '');
  }, [user]);

  const bmi = useMemo(() => calculateBmi(heightCm, weightKg), [heightCm, weightKg]);
  const isCompletionFlow = mode === 'complete';
  const parsedHighSchoolCompletionYear = normalizeInt(highSchoolCompletionYear);
  const parsedGraduationYear = normalizeInt(graduationYear);
  const parsedHeightCm = normalizeFloat(heightCm);
  const parsedWeightKg = normalizeFloat(weightKg);
  const highSchoolCompletionYearValid = isYearInRange(parsedHighSchoolCompletionYear);
  const invalidHighSchoolCompletionYear =
    highSchoolCompletionYear.trim() !== '' && !highSchoolCompletionYearValid;
  const graduationYearValid = !graduationYear.trim() || isYearInRange(parsedGraduationYear);
  const invalidGraduationYear = graduationYear.trim() !== '' && !graduationYearValid;
  const heightCmValid = !heightCm.trim() || isPositiveWithin(parsedHeightCm, MAX_HEIGHT_CM);
  const invalidHeightCm = heightCm.trim() !== '' && !heightCmValid;
  const weightKgValid = !weightKg.trim() || isPositiveWithin(parsedWeightKg, MAX_WEIGHT_KG);
  const invalidWeightKg = weightKg.trim() !== '' && !weightKgValid;
  const hasInvalidNumericInput =
    invalidHighSchoolCompletionYear ||
    invalidGraduationYear ||
    invalidHeightCm ||
    invalidWeightKg;
  const completionReady =
    !!fullName.trim() &&
    !!birthDate &&
    !!country.trim() &&
    !!city.trim() &&
    !!subcity.trim() &&
    !!educationLevel.trim() &&
    !!highSchoolName.trim() &&
    highSchoolCompletionYearValid;

  if (!user) return null;

  const payload: UpdateProfilePayload = {
    full_name: fullName.trim(),
    phone: normalizeText(phone),
    birth_date: birthDate || null,
    country: normalizeText(country),
    city: normalizeText(city),
    subcity: normalizeText(subcity),
    address_line: normalizeText(addressLine),
    education_level: normalizeText(educationLevel),
    high_school_name: normalizeText(highSchoolName),
    high_school_completion_year: highSchoolCompletionYearValid
      ? parsedHighSchoolCompletionYear
      : null,
    higher_education_institution: normalizeText(higherEducationInstitution),
    higher_education_level: normalizeText(higherEducationLevel),
    field_of_study: normalizeText(fieldOfStudy),
    graduation_year: graduationYearValid ? parsedGraduationYear : null,
    height_cm: heightCmValid ? parsedHeightCm : null,
    weight_kg: weightKgValid ? parsedWeightKg : null,
    skills_summary: normalizeText(skillsSummary),
    experience_summary: normalizeText(experienceSummary),
  };

  const saveLabel = isCompletionFlow
    ? t('recruit.profileComplete.saveAndContinue')
    : t('recruit.profile.save');

  const onSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await updateMe(payload);
      await refreshUser();
      if (isCompletionFlow) {
        navigate('/candidate/dashboard', { replace: true });
        return;
      }
      setSuccessMessage(t('recruit.profile.updateSuccess'));
    } catch (err) {
      setErrorMessage(
        getApiErrorMessage(
          err,
          t(isCompletionFlow ? 'recruit.profileComplete.updateError' : 'recruit.profile.updateError'),
          t('common.networkError')
        )
      );
    } finally {
      setIsSaving(false);
    }
  };

  const onSkip = async () => {
    setIsSkipping(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await updateMe({ profile_completion_skipped: true });
      await refreshUser();
      navigate('/candidate/dashboard', { replace: true });
    } catch (err) {
      setErrorMessage(
        getApiErrorMessage(err, t('recruit.profileComplete.skipError'), t('common.networkError'))
      );
    } finally {
      setIsSkipping(false);
    }
  };

  return (
    <Card sx={{ mt: isCompletionFlow ? 0 : 3 }}>
      <CardContent>
        <Stack spacing={3}>
          <Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
              <Typography variant="h6">{t(`recruit.${isCompletionFlow ? 'profileComplete.title' : 'profile.editTitle'}`)}</Typography>
              <Chip
                color={user.profile_completed ? 'success' : 'warning'}
                label={t(user.profile_completed ? 'recruit.profile.statusComplete' : 'recruit.profile.statusIncomplete')}
                size="small"
              />
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {t(
                `recruit.${isCompletionFlow ? 'profileComplete.subtitle' : 'profile.candidateSubtitle'}`
              )}
            </Typography>
            {isCompletionFlow && (
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {t('recruit.profileComplete.requiredHint')}
              </Typography>
            )}
          </Box>

          {successMessage && <Alert severity="success">{successMessage}</Alert>}
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <TextField
              label={t('signup.fullName')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <TextField
              label={t('signup.phone')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              helperText={t('signup.phoneHelp')}
            />
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {t('recruit.profile.sections.personal')}
            </Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
              <TextField
                label={t('recruit.profile.fields.birthDate')}
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required={isCompletionFlow}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label={t('recruit.profile.fields.addressLine')}
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
              />
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {t('recruit.profile.sections.address')}
            </Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' } }}>
              <TextField
                label={t('recruit.profile.fields.country')}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required={isCompletionFlow}
              />
              <TextField
                label={t('recruit.profile.fields.city')}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required={isCompletionFlow}
              />
              <TextField
                label={t('recruit.profile.fields.subcity')}
                value={subcity}
                onChange={(e) => setSubcity(e.target.value)}
                required={isCompletionFlow}
              />
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {t('recruit.profile.sections.education')}
            </Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
              <TextField
                label={t('recruit.profile.fields.educationLevel')}
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                required={isCompletionFlow}
              />
              <TextField
                label={t('recruit.profile.fields.highSchoolName')}
                value={highSchoolName}
                onChange={(e) => setHighSchoolName(e.target.value)}
                required={isCompletionFlow}
              />
              <TextField
                label={t('recruit.profile.fields.highSchoolCompletionYear')}
                value={highSchoolCompletionYear}
                onChange={(e) => setHighSchoolCompletionYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required={isCompletionFlow}
                error={invalidHighSchoolCompletionYear}
                helperText={
                  invalidHighSchoolCompletionYear
                    ? t('recruit.profile.validation.valueRangeHelper', {
                        min: MIN_YEAR,
                        max: MAX_YEAR,
                      })
                    : undefined
                }
                inputProps={{ inputMode: 'numeric', maxLength: 4, min: MIN_YEAR, max: MAX_YEAR }}
              />
              <TextField
                label={t('recruit.profile.fields.higherEducationInstitution')}
                value={higherEducationInstitution}
                onChange={(e) => setHigherEducationInstitution(e.target.value)}
                helperText={t('recruit.profile.optional')}
              />
              <TextField
                label={t('recruit.profile.fields.higherEducationLevel')}
                value={higherEducationLevel}
                onChange={(e) => setHigherEducationLevel(e.target.value)}
                helperText={t('recruit.profile.optional')}
              />
              <TextField
                label={t('recruit.profile.fields.fieldOfStudy')}
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
                helperText={t('recruit.profile.optional')}
              />
              <TextField
                label={t('recruit.profile.fields.graduationYear')}
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                error={invalidGraduationYear}
                inputProps={{ inputMode: 'numeric', maxLength: 4, min: MIN_YEAR, max: MAX_YEAR }}
                helperText={
                  invalidGraduationYear
                    ? t('recruit.profile.validation.valueRangeHelper', {
                        min: MIN_YEAR,
                        max: MAX_YEAR,
                      })
                    : t('recruit.profile.optional')
                }
              />
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {t('recruit.profile.sections.health')}
            </Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' } }}>
              <TextField
                label={t('recruit.profile.fields.heightCm')}
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                error={invalidHeightCm}
                helperText={
                  invalidHeightCm
                    ? t('recruit.profile.validation.valueRangeHelper', {
                        min: 1,
                        max: MAX_HEIGHT_CM,
                      })
                    : undefined
                }
                inputProps={{ inputMode: 'decimal', min: 1, max: MAX_HEIGHT_CM, step: '0.1' }}
              />
              <TextField
                label={t('recruit.profile.fields.weightKg')}
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                error={invalidWeightKg}
                helperText={
                  invalidWeightKg
                    ? t('recruit.profile.validation.valueRangeHelper', {
                        min: 1,
                        max: MAX_WEIGHT_KG,
                      })
                    : undefined
                }
                inputProps={{ inputMode: 'decimal', min: 1, max: MAX_WEIGHT_KG, step: '0.1' }}
              />
              <TextField
                label={t('recruit.profile.fields.bmi')}
                value={bmi ?? ''}
                helperText={t('recruit.profile.bmiHelper')}
                slotProps={{ input: { readOnly: true } }}
              />
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {t('recruit.profile.sections.career')}
            </Typography>
            <Stack spacing={2}>
              <TextField
                label={t('recruit.profile.fields.skillsSummary')}
                value={skillsSummary}
                onChange={(e) => setSkillsSummary(e.target.value)}
                multiline
                minRows={3}
              />
              <TextField
                label={t('recruit.profile.fields.experienceSummary')}
                value={experienceSummary}
                onChange={(e) => setExperienceSummary(e.target.value)}
                multiline
                minRows={4}
              />
            </Stack>
          </Box>

          {isCompletionFlow && !completionReady && (
            <Alert severity="info">{t('recruit.profileComplete.completeRequiredFields')}</Alert>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              onClick={onSave}
              disabled={
                isSaving ||
                isSkipping ||
                hasInvalidNumericInput ||
                (isCompletionFlow && !completionReady)
              }
            >
              {isSaving ? t('recruit.profile.saving') : saveLabel}
            </Button>
            {isCompletionFlow && (
              <Button variant="text" onClick={onSkip} disabled={isSaving || isSkipping}>
                {isSkipping ? t('recruit.profileComplete.skipping') : t('recruit.profileComplete.skip')}
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
