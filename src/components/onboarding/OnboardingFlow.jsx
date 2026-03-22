/**
 * Onboarding Flow
 *
 * Post-signup onboarding: Terms → Privacy → Consent → Age Group → Complete.
 * Baseline assessment is deferred to the first training session.
 *
 * @module components/onboarding/OnboardingFlow
 */

import { useState } from 'react';
import { useTranslation } from '../../i18n/index.jsx';
import { AGE_NORMS } from '../../engine/gameConfig.js';
import { saveOnboarding } from '../../services/dataService.js';

const STEPS = ['terms', 'privacy', 'consent', 'age_group'];

export function OnboardingFlow({ user, onComplete }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [researchConsent, setResearchConsent] = useState(false);
  const [ageGroup, setAgeGroup] = useState(null);

  const currentStep = STEPS[step];

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  }

  function handleFinish(selectedAge) {
    const data = {
      onboarded: true,
      acceptedTerms: true,
      acceptedPrivacy: true,
      researchConsent,
      ageGroup: selectedAge || ageGroup,
      onboardedAt: Date.now(),
    };
    saveOnboarding(data);
    onComplete();
  }

  return (
    <div className="fixed inset-0 flex justify-center bg-surface-dim z-50">
      <div className="relative w-full max-w-[480px] bg-background flex flex-col safe-inset overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-surface-container-highest">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          {currentStep === 'terms' && (
            <TermsStep
              t={t}
              accepted={acceptedTerms}
              onToggle={() => setAcceptedTerms(!acceptedTerms)}
              onNext={handleNext}
            />
          )}
          {currentStep === 'privacy' && (
            <PrivacyStep
              t={t}
              accepted={acceptedPrivacy}
              onToggle={() => setAcceptedPrivacy(!acceptedPrivacy)}
              onNext={handleNext}
            />
          )}
          {currentStep === 'consent' && (
            <ConsentStep
              t={t}
              consented={researchConsent}
              onToggle={() => setResearchConsent(!researchConsent)}
              onNext={handleNext}
            />
          )}
          {currentStep === 'age_group' && (
            <AgeGroupStep
              t={t}
              onSelect={(age) => {
                setAgeGroup(age);
                handleFinish(age);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TermsStep({ t, accepted, onToggle, onNext }) {
  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-3xl">gavel</span>
        <h2 className="font-headline text-2xl font-bold text-on-surface">{t('terms.title')}</h2>
      </div>

      <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/20 max-h-[50vh] overflow-y-auto space-y-4 text-on-surface-variant text-sm leading-relaxed">
        <p className="text-on-surface-variant text-xs">{t('terms.effectiveDate')} {t('terms.effectiveDateValue')}</p>
        <p>{t('terms.intro')}</p>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <div key={n}>
            <h4 className="font-bold text-on-surface">{t(`terms.s${n}.title`)}</h4>
            <p dangerouslySetInnerHTML={{ __html: t(`terms.s${n}.body`) }} />
          </div>
        ))}
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={accepted}
          onChange={onToggle}
          className="mt-1 w-5 h-5 rounded border-outline-variant accent-primary cursor-pointer"
        />
        <span className="text-on-surface text-sm font-medium">{t('terms.checkLabel')}</span>
      </label>

      <button
        onClick={onNext}
        disabled={!accepted}
        className="w-full py-4 rounded-xl bg-primary text-on-primary font-bold text-lg
                   active:scale-95 transition-transform duration-200 disabled:opacity-40"
      >
        {t('nav.continue')}
      </button>
    </div>
  );
}

function PrivacyStep({ t, accepted, onToggle, onNext }) {
  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-3xl">shield</span>
        <h2 className="font-headline text-2xl font-bold text-on-surface">{t('privacy.title')}</h2>
      </div>

      <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/20 max-h-[50vh] overflow-y-auto space-y-4 text-on-surface-variant text-sm leading-relaxed">
        <p className="text-on-surface-variant text-xs">{t('privacy.effectiveDate')} {t('privacy.effectiveDateValue')}</p>
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <div key={n}>
            <h4 className="font-bold text-on-surface">{t(`privacy.s${n}.title`)}</h4>
            <p dangerouslySetInnerHTML={{ __html: t(`privacy.s${n}.body`) }} />
          </div>
        ))}
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={accepted}
          onChange={onToggle}
          className="mt-1 w-5 h-5 rounded border-outline-variant accent-primary cursor-pointer"
        />
        <span className="text-on-surface text-sm font-medium">{t('privacy.checkLabel')}</span>
      </label>

      <button
        onClick={onNext}
        disabled={!accepted}
        className="w-full py-4 rounded-xl bg-primary text-on-primary font-bold text-lg
                   active:scale-95 transition-transform duration-200 disabled:opacity-40"
      >
        {t('nav.continue')}
      </button>
    </div>
  );
}

function ConsentStep({ t, consented, onToggle, onNext }) {
  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-3xl">science</span>
        <h2 className="font-headline text-2xl font-bold text-on-surface">{t('consent.title')}</h2>
      </div>

      <p className="text-on-surface-variant">{t('consent.intro')}</p>

      <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/20 space-y-4">
        <div>
          <h4 className="font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
            {t('consent.required.title')}
          </h4>
          <p className="text-on-surface-variant text-sm mt-1">{t('consent.required.body')}</p>
        </div>
        <div className="border-t border-outline-variant/20 pt-4">
          <h4 className="font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-xl">volunteer_activism</span>
            {t('consent.optional.title')}
          </h4>
          <p className="text-on-surface-variant text-sm mt-1">{t('consent.optional.body')}</p>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={consented}
          onChange={onToggle}
          className="mt-1 w-5 h-5 rounded border-outline-variant accent-primary cursor-pointer"
        />
        <span className="text-on-surface text-sm font-medium">
          {t('consent.checkbox')} <span className="text-on-surface-variant">{t('consent.checkboxOptional')}</span>
        </span>
      </label>

      <p className="text-on-surface-variant text-xs">{t('consent.changeAnytime')}</p>

      <button
        onClick={onNext}
        className="w-full py-4 rounded-xl bg-primary text-on-primary font-bold text-lg
                   active:scale-95 transition-transform duration-200"
      >
        {t('consent.continue')}
      </button>
    </div>
  );
}

function AgeGroupStep({ t, onSelect }) {
  const ageGroups = Object.keys(AGE_NORMS);

  return (
    <div className="space-y-6 animate-in">
      <div className="text-center space-y-3">
        <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          person
        </span>
        <h2 className="font-headline text-2xl font-bold text-on-surface">{t('onboarding.ageGroupLabel')}</h2>
        <p className="text-on-surface-variant text-sm">{t('settings.ageGroupHint')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ageGroups.map((age) => (
          <button
            key={age}
            onClick={() => onSelect(age)}
            className="py-4 px-4 rounded-xl bg-surface-container-low border border-outline-variant/20
                       text-on-surface font-bold text-lg
                       hover:bg-surface-container-high hover:border-primary/30
                       active:scale-95 transition-all duration-200 cursor-pointer"
          >
            {age}
          </button>
        ))}
      </div>

      <p className="text-on-surface-variant text-xs text-center">{t('onboarding.ageDisclaimer')}</p>
    </div>
  );
}
