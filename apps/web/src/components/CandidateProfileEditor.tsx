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

function normalizeText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeInt(value: string): number | null {
  const trimmed = value.trim();
  return trimmed ? Number.parseInt(trimmed, 10) : null;
}

function normalizeFloat(value: string): number | null {
  const trimmed = value.trim();
  return trimmed ? Number.parseFloat(trimmed) : null;
}

function calculateBmi(heightCm: string, weightKg: string): number | null {
  const height = normalizeFloat(heightCm);
  const weight = normalizeFloat(weightKg);
  if (!height || !weight || height <= 0 || weight <= 0) return null;
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
  const completionReady =
    !!fullName.trim() &&
    !!birthDate &&
    !!country.trim() &&
    !!city.trim() &&
    !!subcity.trim() &&
    !!educationLevel.trim() &&
    !!highSchoolName.trim() &&
    !!highSchoolCompletionYear.trim();

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
    high_school_completion_year: normalizeInt(highSchoolCompletionYear),
    higher_education_institution: normalizeText(higherEducationInstitution),
    higher_education_level: normalizeText(higherEducationLevel),
    field_of_study: normalizeText(fieldOfStudy),
    graduation_year: normalizeInt(graduationYear),
    height_cm: normalizeFloat(heightCm),
    weight_kg: normalizeFloat(weightKg),
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
                inputProps={{ inputMode: 'numeric', maxLength: 4 }}
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
                inputProps={{ inputMode: 'numeric', maxLength: 4 }}
                helperText={t('recruit.profile.optional')}
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
                inputProps={{ inputMode: 'decimal' }}
              />
              <TextField
                label={t('recruit.profile.fields.weightKg')}
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                inputProps={{ inputMode: 'decimal' }}
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
              disabled={isSaving || isSkipping || (isCompletionFlow && !completionReady)}
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
