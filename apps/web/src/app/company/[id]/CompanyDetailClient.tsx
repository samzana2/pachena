'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import {
  AlertCircle, Gift, ChevronDown, ChevronUp,
  ArrowLeft, Flag, CheckCircle2, Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TraceCard } from '@/components/ui/trace-card'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import StarRating from '@/components/StarRating'
import { AccurateButton } from '@/components/AccurateButton'
import { SalaryAccurateButton } from '@/components/SalaryAccurateButton'
import { ReportReviewDialog } from '@/components/ReportReviewDialog'
import { InterviewExperienceSection } from '@/components/InterviewExperienceSection'
import DemographicsInsights from '@/components/DemographicsInsights'
import FilterSidebar from '@/components/FilterSidebar'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { ReviewSectionPicker } from '@/components/review/ReviewSectionPicker'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { applyRedactions, type RedactionEntry } from '@/lib/applyRedactions'
import { getTotalComp, ANNUAL_BENEFIT_KEYS } from '@/lib/salaryUtils'
import { extractEdgeFunctionError } from '@/lib/edge-function-errors'
import { useToast } from '@/hooks/use-toast'
import type { CompanyDetailProps } from './page'

// ── Types ───────────────────────────────────────────────────────────────────

type TabType = 'about' | 'reviews' | 'pay' | 'interviews'

interface ReviewResponse {
  id: string
  response_text: string
  created_at: string
}

interface DisplayReview {
  id: string
  rating: number
  title: string
  pros: string
  cons: string
  advice?: string | null
  role_title: string | null
  employment_status: string | null
  created_at: string
  recommend_to_friend: boolean | null
  ceo_approval: boolean | null
  response?: ReviewResponse
  hidden_fields?: string[] | null
  verification_type?: string | null
  helpful_count?: number | null
  end_year?: number | null
}

interface ReviewCompensationItem {
  role_level: string | null
  department: string | null
  salary_range: string | null
  base_salary_amount: number | null
  base_salary_currency: string | null
  is_net_salary: boolean | null
  allowances_amount: number | null
  allowances_currency: string | null
  bonus_amount: number | null
  bonus_currency: string | null
  secondary_salary_amount: number | null
  secondary_salary_currency: string | null
  hidden_fields: string[] | null
  employment_type: string | null
  thirteenth_cheque_annual_value: number | null
  benefit_values: Record<string, number> | null
  standard_benefit_ids: string[] | null
  custom_benefits: string[] | null
}

interface InterviewItem {
  id: string
  interview_experience_rating: number | null
  interview_count: number | null
  interview_difficulty: string | null
  interview_description: string | null
  interview_tips: string | null
  created_at: string
  helpful_count: number | null
}

interface StandardBenefitWithCount {
  id: string
  benefit_key: string
  benefit_label: string
  confirmations: number
}

// ── Constants ───────────────────────────────────────────────────────────────

const SALARY_BANDS = [
  { label: 'Under $200', max: 250 },
  { label: '$250 – $500', min: 250, max: 500 },
  { label: '$500 – $1,000', min: 500, max: 1000 },
  { label: '$1,000 – $1,500', min: 1000, max: 1500 },
  { label: '$1,500 – $2,000', min: 1500, max: 2000 },
  { label: '$2,000 – $2,500', min: 2000, max: 2500 },
  { label: '$2,500 – $3,000', min: 2500, max: 3000 },
  { label: '$3,000 – $3,500', min: 3000, max: 3500 },
  { label: '$3,500 – $4,000', min: 3500, max: 4000 },
  { label: '$4,000 – $4,500', min: 4000, max: 4500 },
  { label: '$4,500 – $5,000', min: 4500, max: 5000 },
  { label: '$5,000 – $5,500', min: 5000, max: 5500 },
  { label: '$5,500 – $6,000', min: 5500, max: 6000 },
  { label: '$6,000 – $6,500', min: 6000, max: 6500 },
  { label: '$6,500 – $7,000', min: 6500, max: 7000 },
  { label: '$7,000 – $7,500', min: 7000, max: 7500 },
  { label: '$7,500 – $8,000', min: 7500, max: 8000 },
  { label: '$8,000 – $8,500', min: 8000, max: 8500 },
  { label: '$8,500 – $9,000', min: 8500, max: 9000 },
  { label: '$9,000 – $9,500', min: 9000, max: 9500 },
  { label: '$9,500 – $10,000', min: 9500, max: 10000 },
  { label: '$10,000+', min: 10000 },
] as const

function getSalaryBand(amount: number): string {
  for (const band of SALARY_BANDS) {
    if ('max' in band && band.max !== undefined && amount < band.max) return band.label
    if (!('max' in band) || band.max === undefined) {
      if ('min' in band && band.min !== undefined && amount >= band.min) return band.label
    }
  }
  return SALARY_BANDS[0].label
}

function getZwlBand(amount: number): string {
  return getSalaryBand(amount).replace(/\$/g, 'ZWL ')
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

const BENEFIT_CATEGORIES: Record<string, { label: string; keys: string[] }> = {
  financial: {
    label: 'Compensation & financial',
    keys: ['medical_aid', 'transport_fuel', 'pension_nssa', 'performance_bonus', 'airtime_data', 'housing_allowance', 'school_fees', 'education_training', 'thirteenth_cheque'],
  },
  leave: {
    label: 'Leave & flexibility',
    keys: ['paid_leave', 'maternity_paternity', 'flexible_remote', 'unlimited_vacation'],
  },
  other: {
    label: 'Other',
    keys: ['funeral_assistance'],
  },
}

const STANDARD_BENEFIT_LABELS: Record<string, string> = {
  medical_aid: 'Medical Aid',
  transport_fuel: 'Transport allowance / Fuel',
  pension_nssa: 'Pension / NSSA contributions',
  performance_bonus: 'Annual Performance Bonus',
  airtime_data: 'Airtime / data allowance',
  housing_allowance: 'Housing allowance',
  school_fees: 'School Fees',
  education_training: 'Education / training support',
  paid_leave: 'Paid leave (annual, sick, maternity)',
  maternity_paternity: 'Maternity / Paternity Leave',
  flexible_remote: 'Flexible or remote work',
  unlimited_vacation: 'Unlimited Vacation Days',
  funeral_assistance: 'Funeral assistance / funeral policy',
  thirteenth_cheque: 'Thirteenth Cheque',
}

const ROLE_LEVEL_MAP: Record<string, string> = {
  Lead: 'Lead / Manager', Manager: 'Lead / Manager', Management: 'Lead / Manager',
  VP: 'C-Suite / Executive', 'C-Suite': 'C-Suite / Executive', Executive: 'C-Suite / Executive',
}

const EXCLUDED_BENEFITS = new Set(['none', 'no benefits at all', ''])

const stripOtherPrefix = (value: string | null | undefined): string | null => {
  if (!value) return null
  return value.startsWith('other:') ? value.slice(6) : value
}

const isValidBenefit = (label: string | null | undefined): boolean => {
  if (!label) return false
  return !EXCLUDED_BENEFITS.has(label.trim().toLowerCase())
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CompanyDetailClient({
  company,
  reviews: initialReviews,
  reviewSections,
  jobs,
  benefits,
}: CompanyDetailProps) {
  const router = useRouter()
  const { toast } = useToast()

  // ── Tab / UI state ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabType>('about')
  const [showSectionPicker, setShowSectionPicker] = useState(false)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    industry: '', location: '', rating: 'all', size: 'all', companyName: '',
  })

  // ── Interaction state ─────────────────────────────────────────────────────
  const [confirmedReviews, setConfirmedReviews] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('pachena_confirmed_reviews')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch { return new Set() }
  })
  const [confirmedSalaryKeys, setConfirmedSalaryKeys] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('pachena_confirmed_salaries')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch { return new Set() }
  })
  const [salaryConfirmations, setSalaryConfirmations] = useState<Record<string, number>>({})
  const [reportDialogReviewId, setReportDialogReviewId] = useState<string | null>(null)
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null)

  // ── Derived / processed data ──────────────────────────────────────────────
  const [reviews, setReviews] = useState<DisplayReview[]>([])
  const [reviewCompensation, setReviewCompensation] = useState<ReviewCompensationItem[]>([])
  const [interviewData, setInterviewData] = useState<InterviewItem[]>([])
  const [ratingCategories, setRatingCategories] = useState<Record<string, number>>({})
  const [allStandardBenefitsMap, setAllStandardBenefitsMap] = useState<Record<string, string>>({})
  const [standardBenefits, setStandardBenefits] = useState<StandardBenefitWithCount[]>([])
  const [demographicData, setDemographicData] = useState({
    age_range: {} as Record<string, number>,
    gender: {} as Record<string, number>,
    ethnicity: {} as Record<string, number>,
    education_level: {} as Record<string, number>,
    totalResponses: 0,
  })

  // ── On-mount client fetch ─────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    const companyId = company.id
    const reviewIds = initialReviews.map(r => r.id).filter(Boolean) as string[]

    async function load() {
      // Partition sections by type (available from SSR props)
      const cultureSections = reviewSections.filter(s => s.section_type === 'culture')
      const compSections = reviewSections.filter(s => s.section_type === 'compensation')
      const intSections = reviewSections.filter(s => s.section_type === 'interview')

      // Fire independent queries in parallel
      const [
        responsesResult,
        ratingsResult,
        salaryConfResult,
        allStdBenefitsResult,
        stdBenefitResult,
        benefitConfirmResult,
      ] = await Promise.all([
        supabase
          .from('review_responses')
          .select('id, review_id, response_text, created_at')
          .eq('company_id', companyId),
        reviewIds.length > 0
          ? supabase.from('rating_categories').select('*').in('review_id', reviewIds)
          : Promise.resolve({ data: null }),
        supabase
          .from('salary_confirmations')
          .select('role_level')
          .eq('company_id', companyId),
        supabase
          .from('standard_benefits')
          .select('id, benefit_key')
          .eq('is_active', true),
        reviewIds.length > 0
          ? supabase
              .from('review_standard_benefits')
              .select('standard_benefit_id, standard_benefits(id, benefit_key, benefit_label)')
              .in('review_id', reviewIds)
          : Promise.resolve({ data: null }),
        benefits.length > 0
          ? supabase
              .from('benefit_confirmations')
              .select('benefit_id')
              .in('benefit_id', benefits.map(b => b.id))
          : Promise.resolve({ data: null }),
      ])

      // ── Build response map ─────────────────────────────────────────────
      const responseMap = new Map<string, ReviewResponse>(
        (responsesResult.data || []).map((r: any) => [
          r.review_id,
          { id: r.id, response_text: r.response_text, created_at: r.created_at },
        ])
      )

      // ── Map culture sections → DisplayReview ──────────────────────────
      const mappedCultureReviews: DisplayReview[] = cultureSections.map(s => {
        const d = applyRedactions(
          (s.section_data as Record<string, unknown>) ?? {},
          s.redactions as RedactionEntry[] | null
        ) as any
        return {
          id: s.id!,
          rating: d.rating || 0,
          title: d.title || 'Culture Review',
          pros: d.pros || '',
          cons: d.cons || '',
          advice: d.advice || null,
          role_title: null,
          employment_status: null,
          created_at: s.created_at!,
          recommend_to_friend: d.recommendation ?? null,
          ceo_approval: d.ceo_approval ?? null,
          hidden_fields: null,
          verification_type: null,
          helpful_count: null,
          end_year: null,
        }
      })

      // ── Merge legacy reviews + culture sections ────────────────────────
      const legacyMapped: DisplayReview[] = initialReviews.map(r => ({
        id: r.id!,
        rating: r.rating ?? 0,
        title: (r as any).title ?? '',
        pros: (r as any).pros ?? '',
        cons: (r as any).cons ?? '',
        advice: (r as any).advice ?? null,
        role_title: r.role_title ?? null,
        employment_status: r.employment_status ?? null,
        created_at: r.created_at!,
        recommend_to_friend: r.recommend_to_friend ?? null,
        ceo_approval: r.ceo_approval ?? null,
        response: responseMap.get(r.id!),
        hidden_fields: r.hidden_fields ?? null,
        verification_type: r.verification_type ?? null,
        helpful_count: r.helpful_count ?? null,
        end_year: (r as any).end_year ?? null,
      }))

      const allReviews = [...legacyMapped, ...mappedCultureReviews].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setReviews(allReviews)

      // ── Rating categories ──────────────────────────────────────────────
      const categoryTotals: Record<string, { sum: number; count: number }> = {}
      if (ratingsResult.data) {
        ratingsResult.data.forEach((r: any) => {
          if (!categoryTotals[r.category]) categoryTotals[r.category] = { sum: 0, count: 0 }
          categoryTotals[r.category].sum += Number(r.rating)
          categoryTotals[r.category].count += 1
        })
      }
      cultureSections.forEach(s => {
        const ratings = ((s.section_data as any) || {}).ratings
        if (Array.isArray(ratings)) {
          ratings.forEach((r: { category: string; rating: number }) => {
            if (!categoryTotals[r.category]) categoryTotals[r.category] = { sum: 0, count: 0 }
            categoryTotals[r.category].sum += Number(r.rating)
            categoryTotals[r.category].count += 1
          })
        }
      })
      const avgRatings: Record<string, number> = {}
      Object.entries(categoryTotals).forEach(([cat, { sum, count }]) => {
        avgRatings[cat] = sum / count
      })
      setRatingCategories(avgRatings)

      // ── Compensation ──────────────────────────────────────────────────
      const legacyCompensation: ReviewCompensationItem[] = initialReviews
        .filter((r: any) => r.salary_range || (r.base_salary_amount && r.base_salary_amount > 0))
        .map((r: any) => ({
          role_level: r.role_level, department: r.department, salary_range: r.salary_range,
          base_salary_amount: r.base_salary_amount, base_salary_currency: r.base_salary_currency,
          is_net_salary: r.is_net_salary, allowances_amount: r.allowances_amount,
          allowances_currency: r.allowances_currency, bonus_amount: r.bonus_amount,
          bonus_currency: r.bonus_currency, secondary_salary_amount: null,
          secondary_salary_currency: null, hidden_fields: r.hidden_fields,
          employment_type: r.employment_type, thirteenth_cheque_annual_value: null,
          benefit_values: null, standard_benefit_ids: null, custom_benefits: null,
        }))

      const sectionCompensation: ReviewCompensationItem[] = compSections.map(s => {
        const d = applyRedactions(
          (s.section_data as Record<string, unknown>) ?? {},
          s.redactions as RedactionEntry[] | null
        ) as any
        return {
          role_level: d.role_level || null, department: d.department || null,
          salary_range: d.salary_range || null, base_salary_amount: d.base_salary_amount || null,
          base_salary_currency: d.base_salary_currency || null, is_net_salary: d.is_net_salary ?? null,
          allowances_amount: d.allowances_amount || null, allowances_currency: d.allowances_currency || null,
          bonus_amount: d.bonus_amount || null, bonus_currency: d.bonus_currency || null,
          secondary_salary_amount: d.secondary_salary_amount || null,
          secondary_salary_currency: d.secondary_salary_currency || null,
          hidden_fields: null, employment_type: d.employment_type || null,
          thirteenth_cheque_annual_value: d.thirteenth_cheque_annual_value || null,
          benefit_values: d.benefit_values && typeof d.benefit_values === 'object' ? d.benefit_values : null,
          standard_benefit_ids: Array.isArray(d.standard_benefit_ids) ? d.standard_benefit_ids : null,
          custom_benefits: Array.isArray(d.custom_benefits) ? d.custom_benefits : null,
        }
      })
      setReviewCompensation([...legacyCompensation, ...sectionCompensation])

      // ── Salary confirmations ──────────────────────────────────────────
      const confCounts: Record<string, number> = {}
      ;(salaryConfResult.data || []).forEach((c: any) => {
        const key = `${companyId}:${c.role_level}`
        confCounts[key] = (confCounts[key] || 0) + 1
      })
      setSalaryConfirmations(confCounts)

      // ── Standard benefits id→key map ──────────────────────────────────
      const stdMap: Record<string, string> = {}
      ;(allStdBenefitsResult.data || []).forEach((sb: any) => {
        if (sb.id && sb.benefit_key) stdMap[sb.id] = sb.benefit_key
      })
      setAllStandardBenefitsMap(stdMap)

      // ── Standard benefits with counts ─────────────────────────────────
      if (stdBenefitResult.data && stdBenefitResult.data.length > 0) {
        const stdBenefitCounts: Record<string, { key: string; label: string; count: number }> = {}
        ;(stdBenefitResult.data as any[]).forEach(item => {
          const benefitId = item.standard_benefit_id
          const benefitKey = item.standard_benefits?.benefit_key
          const benefitLabel = item.standard_benefits?.benefit_label
          if (benefitId && benefitLabel) {
            if (!stdBenefitCounts[benefitId]) stdBenefitCounts[benefitId] = { key: benefitKey || '', label: benefitLabel, count: 0 }
            stdBenefitCounts[benefitId].count++
          }
        })
        setStandardBenefits(
          Object.entries(stdBenefitCounts).map(([id, { key, label, count }]) => ({
            id, benefit_key: key, benefit_label: label, confirmations: count,
          }))
        )
      }

      // ── Interview data ────────────────────────────────────────────────
      const legacyInterviews: InterviewItem[] = initialReviews
        .filter((r: any) => r.did_interview === true)
        .map((r: any) => ({
          id: r.id, interview_experience_rating: r.interview_experience_rating,
          interview_count: r.interview_count, interview_difficulty: r.interview_difficulty,
          interview_description: r.interview_description, interview_tips: r.interview_tips,
          created_at: r.created_at, helpful_count: r.helpful_count || 0,
        }))

      const sectionInterviews: InterviewItem[] = intSections.map(s => {
        const d = applyRedactions(
          (s.section_data as Record<string, unknown>) ?? {},
          s.redactions as RedactionEntry[] | null
        ) as any
        return {
          id: s.id!, interview_experience_rating: d.interview_experience_rating || null,
          interview_count: d.interview_count || null, interview_difficulty: d.interview_difficulty || null,
          interview_description: d.interview_description || null, interview_tips: d.interview_tips || null,
          created_at: s.created_at!, helpful_count: 0,
        }
      })
      setInterviewData([...legacyInterviews, ...sectionInterviews])

      // ── Demographics ──────────────────────────────────────────────────
      const demographics = {
        age_range: {} as Record<string, number>,
        gender: {} as Record<string, number>,
        ethnicity: {} as Record<string, number>,
        education_level: {} as Record<string, number>,
        totalResponses: 0,
      }
      const addDemographic = (source: any) => {
        let hasAny = false
        const fields = ['age_range', 'gender', 'ethnicity', 'education_level'] as const
        for (const f of fields) {
          const val = source[f]
          if (val && val !== 'Prefer not to say') {
            demographics[f][val] = (demographics[f][val] || 0) + 1
            hasAny = true
          }
        }
        if (hasAny) demographics.totalResponses++
      }
      initialReviews.forEach(r => addDemographic(r))
      compSections.forEach(s => addDemographic((s.section_data as any) || {}))
      setDemographicData(demographics)
    }

    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company.id])

  // ── Derived stats ─────────────────────────────────────────────────────────
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
    : 0

  const recommendPercent = reviews.length > 0
    ? Math.round((reviews.filter(r => r.recommend_to_friend).length / reviews.length) * 100)
    : 0

  const reviewsWithCeoResponse = reviews.filter(r => r.ceo_approval !== null)
  const ceoApprovalPercent = reviewsWithCeoResponse.length > 0
    ? Math.round((reviewsWithCeoResponse.filter(r => r.ceo_approval === true).length / reviewsWithCeoResponse.length) * 100)
    : 0

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (filters.companyName) params.set('search', filters.companyName)
    if (filters.industry) params.set('industry', filters.industry)
    if (filters.location) params.set('location', filters.location)
    if (filters.rating !== 'all') params.set('rating', filters.rating)
    if (filters.size !== 'all') params.set('size', filters.size)
    router.push(`/companies?${params.toString()}`)
  }

  const handleReportReview = async (reviewId: string, reason: string) => {
    setReportingReviewId(reviewId)
    const supabase = createBrowserSupabaseClient()
    try {
      const response = await supabase.functions.invoke('flag-review', {
        body: { reviewId, reason, section: 'review' },
      })
      const errorMessage = await extractEdgeFunctionError(response)
      if (errorMessage) throw new Error(errorMessage)
      toast({
        title: 'Report submitted',
        description: 'Thank you for helping us maintain a trustworthy platform. Our team will review this content.',
      })
      setReportDialogReviewId(null)
    } catch (error: any) {
      toast({ title: 'Failed to submit report', description: error.message || 'Please try again later.', variant: 'destructive' })
    } finally {
      setReportingReviewId(null)
    }
  }

  // ── Pay tab helpers ───────────────────────────────────────────────────────
  const compSubmissions = reviewCompensation.filter(c =>
    !((c.hidden_fields || []).includes('compensation')) &&
    c.base_salary_amount && c.base_salary_amount > 0
  )
  const salaryTier = compSubmissions.length < 2 ? 1 : compSubmissions.length < 5 ? 2 : 3

  const totalBenefitSubmissions = reviewCompensation.length
  const benefitCounts: Record<string, number> = {}
  const customBenefitCounts: Record<string, number> = {}

  reviewCompensation.forEach(comp => {
    if (comp.standard_benefit_ids?.length) {
      comp.standard_benefit_ids.forEach(id => {
        const key = allStandardBenefitsMap[id]
        if (key) benefitCounts[key] = (benefitCounts[key] || 0) + 1
      })
    }
    if (comp.thirteenth_cheque_annual_value && comp.thirteenth_cheque_annual_value > 0) {
      benefitCounts['thirteenth_cheque'] = (benefitCounts['thirteenth_cheque'] || 0) + 1
    }
    if (comp.benefit_values?.performance_bonus_annual_value && comp.benefit_values.performance_bonus_annual_value > 0) {
      benefitCounts['performance_bonus'] = (benefitCounts['performance_bonus'] || 0) + 1
    }
    comp.custom_benefits?.forEach(cb => {
      customBenefitCounts[cb] = (customBenefitCounts[cb] || 0) + 1
    })
  })
  standardBenefits.forEach(sb => {
    if (sb.benefit_key && sb.confirmations > 0 && !benefitCounts[sb.benefit_key]) {
      benefitCounts[sb.benefit_key] = sb.confirmations
    }
  })

  const hasBenefitData = Object.keys(benefitCounts).length > 0 || Object.keys(customBenefitCounts).length > 0 || benefits.length > 0
  const showPrevalence = salaryTier === 3

  const renderBenefitTag = (key: string, label: string, count: number) => {
    if (!isValidBenefit(label)) return null
    const isMost = count > totalBenefitSubmissions / 2
    if (showPrevalence) {
      return isMost ? (
        <Badge key={key} variant="outline" className="text-xs" style={{ background: '#EAF3DE', color: '#27500A', border: '0.5px solid #C0DD97' }}>
          ✓ {label}
        </Badge>
      ) : (
        <Badge key={key} variant="outline" className="text-xs" style={{ background: '#F1EFE8', color: '#5F5E5A', border: '0.5px solid #D3D1C7' }}>
          {label}
        </Badge>
      )
    }
    return (
      <Badge key={key} variant="outline" className="text-xs" style={{ background: '#F1EFE8', color: '#5F5E5A', border: '0.5px solid #D3D1C7' }}>
        {label}
      </Badge>
    )
  }

  const renderBenefitsSection = () => (
    <Card className="border border-black/5 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
              <Gift className="h-5 w-5 text-foreground" />
              Benefits &amp; Perks
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Employee reported benefits</p>
          </div>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 rounded-full hover:bg-muted transition-colors">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs border shadow-sm">
                <p>Benefits reported by employees who submitted compensation reviews. Prevalence is shown when 5+ submissions exist.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {!hasBenefitData ? (
          <div className="mt-4 text-center py-6 border border-dashed rounded-lg">
            <Gift className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-muted-foreground">No benefits reported yet.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Be the first to share your experience.{' '}
              <button onClick={() => setShowSectionPicker(true)} className="text-primary underline hover:no-underline">
                Submit a review
              </button>
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {(['financial', 'leave', 'other'] as const).map(catKey => {
              const category = BENEFIT_CATEGORIES[catKey]
              const tagsInCategory = category.keys.filter(k => (benefitCounts[k] || 0) > 0 && isValidBenefit(STANDARD_BENEFIT_LABELS[k] || k))
              const customTags = catKey === 'other' ? Object.keys(customBenefitCounts).filter(cb => isValidBenefit(cb)) : []
              const employerBenefits = catKey === 'other'
                ? benefits.filter(b => !standardBenefits.some(sb => sb.benefit_label === b.benefit_name) && isValidBenefit(b.benefit_name))
                : []
              if (tagsInCategory.length === 0 && customTags.length === 0 && employerBenefits.length === 0) return null
              return (
                <div key={catKey}>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{category.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tagsInCategory.map(k => renderBenefitTag(k, STANDARD_BENEFIT_LABELS[k] || k, benefitCounts[k]))}
                    {customTags.map(cb => renderBenefitTag(`custom-${cb}`, cb, customBenefitCounts[cb]))}
                    {employerBenefits.map(b => (
                      <Badge key={`emp-${b.id}`} variant="outline" className="text-xs" style={{ background: '#F1EFE8', color: '#5F5E5A', border: '0.5px solid #D3D1C7' }}>
                        {b.benefit_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })}
            {showPrevalence && (
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3B6D11', display: 'inline-block' }} />
                  <span className="text-[11px] text-muted-foreground">Reported by most reviewers</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#888780', display: 'inline-block' }} />
                  <span className="text-[11px] text-muted-foreground">Reported by some reviewers</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )

  // ── Tab counts ────────────────────────────────────────────────────────────
  const compCount = reviewCompensation.filter(c => c.salary_range !== null || c.base_salary_amount !== null).length
  const interviewCount = interviewData.filter(i =>
    i.interview_experience_rating || i.interview_difficulty || i.interview_description || i.interview_tips
  ).length

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="py-10">
        <div className="container">
          <div className="flex flex-col gap-8 sm:flex-row">
            {/* Sidebar */}
            <aside className="hidden w-[280px] shrink-0 lg:block">
              <FilterSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                onSearch={handleSearch}
                showSearchButton={true}
                showCompanySearch={true}
              />
            </aside>

            {/* Main Content */}
            <div className="flex-1 space-y-6">
              {/* Back link */}
              <Link href="/companies" className="inline-flex items-center gap-2 text-sm text-black/60 hover:text-black transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to all companies
              </Link>

              {/* Mobile filter */}
              <div className="lg:hidden">
                <Collapsible open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="flex items-center gap-2">Filter Companies</span>
                      {mobileFilterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <FilterSidebar
                      filters={filters}
                      onFilterChange={handleFilterChange}
                      onSearch={handleSearch}
                      showSearchButton={true}
                      showCompanySearch={true}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Company Header Card */}
              <Card className="border border-black/5 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="relative hidden h-16 w-16 shrink-0 items-center justify-center rounded-xl overflow-hidden sm:flex">
                      {company.logo_url ? (
                        <img src={company.logo_url} alt={company.name} className="h-16 w-16 object-contain p-1" />
                      ) : (
                        <span className="text-2xl font-bold text-black/40">{company.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl font-medium text-black">{company.name}</h1>
                            <StarRating rating={avgRating} size="sm" />
                          </div>
                          <p className="text-sm text-black/60 mt-1">
                            {company.employee_count || 'Unknown'} Employees
                          </p>
                        </div>
                        {company.is_claimed ? (
                          <Badge className="shrink-0 text-xs bg-black/5 text-black border-0 hover:bg-black/10 rounded-lg h-fit">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="shrink-0 text-xs border-black/10 text-black/50 rounded-lg h-fit">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Unclaimed
                          </Badge>
                        )}
                      </div>
                      <p className="mt-3 text-sm text-black/70">{company.description || 'No description available.'}</p>

                      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-0 sm:flex-row sm:items-center sm:gap-4">
                          {([
                            { key: 'about', label: 'About' },
                            { key: 'reviews', label: `Reviews${reviews.length >= 5 ? ` (${reviews.length})` : ''}` },
                            { key: 'pay', label: `Pay & Benefits${compCount >= 5 ? ` (${compCount})` : ''}` },
                            { key: 'interviews', label: `Interview Insights${interviewCount >= 5 ? ` (${interviewCount})` : ''}` },
                          ] as const).map(tab => (
                            <button
                              key={tab.key}
                              onClick={() => setActiveTab(tab.key)}
                              className={`text-left text-sm py-1.5 px-3 sm:py-0 sm:px-0 sm:pb-1 font-medium ${
                                activeTab === tab.key
                                  ? 'border-l-2 border-primary text-black font-semibold sm:border-l-0 sm:border-b-2 sm:font-medium'
                                  : 'border-l-2 border-transparent text-black/60 hover:text-black sm:border-l-0 sm:border-b-2'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          className="w-full sm:w-auto shrink-0 bg-brand text-brand-foreground hover:bg-transparent hover:text-brand border border-brand"
                          onClick={() => setShowSectionPicker(true)}
                        >
                          Add a Review
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Claim Company Banner */}
              {!company.is_claimed && (
                <Card className="border border-black/5 shadow-sm bg-secondary/30">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-black">Is this your company?</p>
                      <p className="text-xs text-black/60">Claim this page to manage your company profile and access private feedback.</p>
                    </div>
                    <Button variant="outline" size="sm" asChild className="shrink-0 w-full sm:w-auto">
                      <Link href="/employers">Claim this Company</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* ── About Tab ─────────────────────────────────────────── */}
              {activeTab === 'about' && (
                <Card className="border border-black/5 shadow-sm animate-fade-in">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-medium text-black">{company.name} Snapshot</h2>

                    {!company.is_claimed && (
                      <div className="mt-4 flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">Unverified Company Information</p>
                          <p className="text-xs text-amber-700 mt-0.5">
                            This company page has not been claimed. The information shown may be incomplete or inaccurate.
                          </p>
                        </div>
                      </div>
                    )}

                    {reviews.length > 0 ? (
                      <>
                        <div className="mt-4 flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-black">{avgRating.toFixed(1)}</span>
                          <StarRating rating={avgRating} size="sm" />
                        </div>
                        <p className="mt-2 text-sm text-black/70">
                          {recommendPercent}% would recommend working at {company.name} to a friend.
                        </p>
                      </>
                    ) : (
                      <p className="mt-4 text-sm text-black/70">No reviews yet. Be the first to share your experience!</p>
                    )}

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <p className="text-sm text-black"><span className="font-medium">Number of Employees:</span>{' '}<span className="text-black/70">{company.employee_count || 'Unknown'}</span></p>
                        <p className="text-sm text-black"><span className="font-medium">Headquarters:</span>{' '}<span className="text-black/70">{company.headquarters || company.location || 'Unknown'}</span></p>
                        <p className="text-sm text-black"><span className="font-medium">Industry:</span>{' '}<span className="text-black/70">{company.industry || 'Unknown'}</span></p>
                        <p className="text-sm text-black"><span className="font-medium">Year Founded:</span>{' '}<span className="text-black/70">{company.year_founded || 'Unknown'}</span></p>
                        {company.ceo && (
                          <p className="text-sm text-black"><span className="font-medium">CEO:</span>{' '}<span className="text-black/70">{company.ceo}</span></p>
                        )}
                        {company.website && (
                          <p className="text-sm text-black">
                            <span className="font-medium">Website:</span>{' '}
                            <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-black/70 hover:underline">
                              {company.website.replace(/^https?:\/\//, '')}
                            </a>
                          </p>
                        )}
                        {company.linkedin_url && (
                          <p className="text-sm text-black">
                            <span className="font-medium">LinkedIn:</span>{' '}
                            <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-black/70 hover:underline">
                              View Profile
                            </a>
                          </p>
                        )}
                        {reviewsWithCeoResponse.length > 0 && (
                          <p className="text-sm text-black">
                            <span className="font-medium">CEO Approval:</span>{' '}
                            <span className="text-black/70">{ceoApprovalPercent}% of employees approve</span>
                          </p>
                        )}
                      </div>
                      {company.mission && (
                        <div>
                          <p className="text-sm font-medium text-black">Mission:</p>
                          <p className="mt-1 text-sm text-black/70">{company.mission}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── Reviews Tab ───────────────────────────────────────── */}
              {activeTab === 'reviews' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Overview card */}
                  <Card className="border border-black/5 shadow-sm">
                    <CardContent className="p-6">
                      <h2 className="text-lg font-medium text-black">{company.name} Overview</h2>
                      {reviews.length > 0 ? (
                        <>
                          <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-black">{avgRating.toFixed(1)}</span>
                            <StarRating rating={avgRating} size="sm" />
                          </div>
                          <p className="mt-2 text-sm text-black/70">
                            {recommendPercent}% would recommend working at {company.name} to a friend.
                          </p>
                          {company.ceo && reviewsWithCeoResponse.length > 0 && (
                            <p className="mt-1 text-sm text-black/70">
                              <span className="font-medium text-black">CEO:</span> {company.ceo}; {ceoApprovalPercent}% approve of CEO
                            </p>
                          )}
                          {company.ceo && reviewsWithCeoResponse.length === 0 && (
                            <p className="mt-1 text-sm text-black/70">
                              <span className="font-medium text-black">CEO:</span> {company.ceo}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="mt-4 text-sm text-black/70">No reviews yet. Be the first to share your experience!</p>
                      )}

                      {Object.keys(ratingCategories).filter(cat => cat !== 'CEO Approval').length > 0 && (
                        <div className="mt-6">
                          <h3 className="font-medium text-black">Ratings</h3>
                          <div className="mt-3 grid gap-2 md:grid-cols-2">
                            {Object.entries(ratingCategories)
                              .filter(([category]) => category !== 'CEO Approval')
                              .map(([category, rating]) => (
                                <div key={category} className="flex items-center justify-between gap-2 text-sm text-black">
                                  <span className="text-black/70">{category}</span>
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                      <div className="h-full bg-primary rounded-full" style={{ width: `${(rating / 5) * 100}%` }} />
                                    </div>
                                    <span className="font-medium text-black w-7 text-right">{rating.toFixed(1)}</span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Demographics */}
                  <DemographicsInsights
                    data={demographicData}
                    totalReviews={reviews.length}
                    minReviewsThreshold={10}
                    isEmployerView={false}
                  />

                  {/* Review cards */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-medium text-black">Employee Reviews</h2>
                    {reviews.length > 0 ? (
                      reviews.map(review => (
                        <TraceCard key={review.id} className="border border-black/5 shadow-sm">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-xl font-bold text-black">{Number(review.rating).toFixed(1)}</span>
                                <StarRating rating={Number(review.rating)} size="sm" />
                                <span className="text-sm text-black/60">{new Date(review.created_at).toLocaleDateString()}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-black/60 hover:text-destructive"
                                onClick={() => setReportDialogReviewId(review.id)}
                              >
                                <Flag className="h-4 w-4" />
                                <span className="ml-1 hidden sm:inline">Report</span>
                              </Button>
                            </div>
                            {!(review.hidden_fields || []).includes('title') && (
                              <p className="mt-3 text-sm italic text-black/70">"{review.title}"</p>
                            )}
                            {review.role_title && !(review.hidden_fields || []).includes('role_title') && (
                              <p className="mt-2 text-xs text-black/60">
                                {review.role_title} •{' '}
                                {review.employment_status?.toLowerCase().includes('former')
                                  ? `Former Employee${review.end_year ? ` (left ${review.end_year})` : ''}`
                                  : 'Current Employee'}
                              </p>
                            )}
                            {!(review.hidden_fields || []).includes('pros') && (
                              <div className="mt-4">
                                <h4 className="font-medium text-black">Pros</h4>
                                <p className="mt-1 text-sm text-black/70">"{review.pros}"</p>
                              </div>
                            )}
                            {!(review.hidden_fields || []).includes('cons') && (
                              <div className="mt-3">
                                <h4 className="font-medium text-black">Cons</h4>
                                <p className="mt-1 text-sm text-black/70">"{review.cons}"</p>
                              </div>
                            )}
                            {review.advice && !(review.hidden_fields || []).includes('advice') && (
                              <div className="mt-3">
                                <h4 className="font-medium text-black">One Thing to Know</h4>
                                <p className="mt-1 text-sm text-black/70">"{review.advice}"</p>
                              </div>
                            )}
                            <AccurateButton
                              reviewId={review.id}
                              helpfulCount={review.helpful_count || 0}
                              confirmedReviews={confirmedReviews}
                              onConfirmed={id => {
                                const next = new Set(confirmedReviews)
                                next.add(id)
                                setConfirmedReviews(next)
                                localStorage.setItem('pachena_confirmed_reviews', JSON.stringify([...next]))
                              }}
                              onCountIncremented={id => {
                                setReviews(prev => prev.map(r =>
                                  r.id === id ? { ...r, helpful_count: (r.helpful_count || 0) + 1 } : r
                                ))
                              }}
                            />
                            {review.response && (
                              <div className="mt-4 pt-4 border-t border-border bg-muted/30 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-medium text-black">Response from {company.name}</span>
                                  <span className="text-xs text-black/50">
                                    {formatDistanceToNow(new Date(review.response.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="text-sm text-black/70">{review.response.response_text}</p>
                              </div>
                            )}
                          </CardContent>
                        </TraceCard>
                      ))
                    ) : (
                      <Card className="border border-black/5 shadow-sm">
                        <CardContent className="p-8 text-center">
                          <p className="text-black/70">No reviews yet. Be the first to share your experience!</p>
                          <Button className="mt-4" onClick={() => setShowSectionPicker(true)}>Write a Review</Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {/* ── Pay & Benefits Tab ────────────────────────────────── */}
              {activeTab === 'pay' && (() => {
                const allAmounts = compSubmissions.map(c => getTotalComp(c))
                const roundTo50 = (v: number) => Math.ceil(v / 50) * 50
                const fmt = (v: number) => `$${v.toLocaleString('en-US')}`

                let rangeLabel = ''
                if (compSubmissions.length === 0) {
                  rangeLabel = ''
                } else if (compSubmissions.length === 1) {
                  rangeLabel = `${getSalaryBand(allAmounts[0])}/month`
                } else {
                  const minRounded = roundTo50(Math.min(...allAmounts))
                  const maxRounded = roundTo50(Math.max(...allAmounts))
                  rangeLabel = minRounded === maxRounded
                    ? `${fmt(minRounded)}/month`
                    : `${fmt(minRounded)} – ${fmt(maxRounded)}/month`
                }

                // Tier 3 role-level groups
                let renderableGroups: [string, typeof compSubmissions][] = []
                if (salaryTier === 3) {
                  const groups: Record<string, typeof compSubmissions> = {}
                  compSubmissions.forEach(c => {
                    const rawRole = c.employment_type === 'Intern' ? 'Intern' : (stripOtherPrefix(c.role_level) || 'Employee')
                    const role = ROLE_LEVEL_MAP[rawRole] || rawRole
                    if (!groups[role]) groups[role] = []
                    groups[role].push(c)
                  })
                  renderableGroups = Object.entries(groups).filter(([, subs]) => subs.length >= 2)
                }

                return (
                  <div className="space-y-6 animate-fade-in">
                    <Card className="border border-black/5 shadow-sm">
                      <CardContent className="p-6">
                        <h2 className="text-lg font-medium text-black">Salaries at {company.name}</h2>
                        {compSubmissions.length === 0 ? (
                          <div>
                            <p className="mt-4 text-muted-foreground">No salary data available yet.</p>
                            <button onClick={() => setShowSectionPicker(true)} className="mt-2 text-sm text-primary underline hover:no-underline">
                              Share your salary details anonymously.
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="mt-4 font-bold text-foreground" style={{ fontSize: 22 }}>{rangeLabel}</p>
                            <p className="mt-1 text-muted-foreground" style={{ fontSize: 13 }}>Estimated total compensation across all roles</p>
                            <p className="mt-3 text-sm text-muted-foreground">
                              This figure spans all roles and levels. More details will appear as additional reviews are submitted.
                            </p>
                            <button onClick={() => setShowSectionPicker(true)} className="mt-2 text-sm text-primary underline hover:no-underline">
                              Share your salary details anonymously.
                            </button>

                            {salaryTier === 3 && renderableGroups.length > 0 && (
                              <div className="mt-6 space-y-4">
                                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                                  <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                  <p className="text-xs text-muted-foreground">
                                    Salaries are grouped by role level and shown as bands to protect reviewer anonymity. Each card represents multiple submissions. The range above includes all submissions.
                                  </p>
                                </div>
                                {renderableGroups.map(([roleLabel, subs]) => {
                                  const compSalaryKey = `${company.id}:${roleLabel}`
                                  const baseSalaries = subs.map(s => s.base_salary_amount!)
                                  const medianBase = median(baseSalaries)
                                  const baseBand = getSalaryBand(medianBase)

                                  const zwlAmounts = subs.filter(s => s.secondary_salary_amount && s.secondary_salary_amount > 0).map(s => s.secondary_salary_amount!)
                                  const hasZwl = zwlAmounts.length > 0
                                  const zwlMedian = hasZwl ? median(zwlAmounts) : 0
                                  const zwlBand = hasZwl ? getZwlBand(zwlMedian) : ''

                                  const totalComps = subs.map(getTotalComp)
                                  const medianTotal = median(totalComps)
                                  const totalBand = medianTotal > medianBase ? getSalaryBand(medianTotal) : null

                                  const deptCounts: Record<string, number> = {}
                                  subs.forEach(s => {
                                    if (s.department) {
                                      const d = stripOtherPrefix(s.department) || ''
                                      if (d) deptCounts[d] = (deptCounts[d] || 0) + 1
                                    }
                                  })
                                  const topDept = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

                                  return (
                                    <div key={roleLabel} className="rounded-lg border border-border p-4 space-y-0">
                                      <div className="hidden sm:flex items-start justify-between">
                                        <div>
                                          <p className="font-semibold text-foreground text-base">{roleLabel}</p>
                                          {topDept && <p className="text-sm text-muted-foreground">{topDept}</p>}
                                        </div>
                                        <div className="text-right">
                                          <p className="text-lg font-medium text-foreground">
                                            {totalBand
                                              ? `${totalBand.startsWith('Under') ? totalBand : `~${totalBand}`}/month`
                                              : `${baseBand}/month`}
                                          </p>
                                          <p className="text-xs text-muted-foreground mt-0.5">
                                            {totalBand ? 'Includes base salary, benefits & allowances' : 'Base salary · net'}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="sm:hidden">
                                        <p className="font-semibold text-foreground" style={{ fontSize: 15 }}>{roleLabel}</p>
                                        {topDept && <p className="text-muted-foreground" style={{ fontSize: 13 }}>{topDept}</p>}
                                        <div style={{ height: 8 }} />
                                        <p className="font-bold text-foreground" style={{ fontSize: 18 }}>
                                          {totalBand
                                            ? `${totalBand.startsWith('Under') ? totalBand : `~${totalBand}`}/month`
                                            : `${baseBand}/month`}
                                        </p>
                                        <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                                          {totalBand ? 'Includes base salary, benefits & allowances' : 'Base salary · net'}
                                        </p>
                                      </div>
                                      <div className="pt-2">
                                        <SalaryAccurateButton
                                          companyId={company.id}
                                          roleLevel={roleLabel}
                                          confirmationCount={salaryConfirmations[compSalaryKey] || 0}
                                          confirmedKeys={confirmedSalaryKeys}
                                          onConfirmed={(key, newCount) => {
                                            const next = new Set(confirmedSalaryKeys)
                                            next.add(key)
                                            setConfirmedSalaryKeys(next)
                                            localStorage.setItem('pachena_confirmed_salaries', JSON.stringify([...next]))
                                            setSalaryConfirmations(prev => ({ ...prev, [key]: newCount }))
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>

                    {salaryTier >= 2 && renderBenefitsSection()}
                  </div>
                )
              })()}

              {/* ── Interviews Tab ────────────────────────────────────── */}
              {activeTab === 'interviews' && (
                <InterviewExperienceSection
                  interviews={interviewData}
                  companyName={company.name}
                  confirmedReviews={confirmedReviews}
                  onConfirmed={id => {
                    const next = new Set(confirmedReviews)
                    next.add(id)
                    setConfirmedReviews(next)
                    localStorage.setItem('pachena_confirmed_reviews', JSON.stringify([...next]))
                  }}
                  onCountIncremented={id => {
                    setInterviewData(prev => prev.map(i =>
                      i.id === id ? { ...i, helpful_count: (i.helpful_count || 0) + 1 } : i
                    ))
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section Picker */}
      <ReviewSectionPicker
        isOpen={showSectionPicker}
        onClose={() => setShowSectionPicker(false)}
        companyId={company.id}
        companyName={company.name}
      />

      {/* Report Review Dialog */}
      <ReportReviewDialog
        open={!!reportDialogReviewId}
        onOpenChange={open => !open && setReportDialogReviewId(null)}
        onSubmit={async reason => {
          if (reportDialogReviewId) await handleReportReview(reportDialogReviewId, reason)
        }}
        isLoading={reportingReviewId === reportDialogReviewId}
      />

      <Footer />
    </div>
  )
}
