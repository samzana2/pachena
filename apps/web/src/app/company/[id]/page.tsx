import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import CompanyDetailClient from './CompanyDetailClient'

type Company = Database['public']['Tables']['companies']['Row']
type Review = Database['public']['Views']['reviews_public']['Row']
type ReviewSection = Database['public']['Views']['review_sections_public']['Row']
type Job = Database['public']['Tables']['jobs']['Row']
type Benefit = Database['public']['Tables']['company_benefits']['Row']

export interface CompanyDetailProps {
  company: Company
  reviews: Review[]
  reviewSections: ReviewSection[]
  jobs: Job[]
  benefits: Benefit[]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: company } = await supabase
    .from('companies')
    .select('name, description')
    .eq('slug', id)
    .single()

  if (!company) return {}

  return {
    title: `${company.name} Reviews & Salaries | Pachena`,
    description:
      company.description ??
      `Read employee reviews and salary data for ${company.name} on Pachena.`,
  }
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('slug', id)
    .single()

  if (!company) notFound()

  const companyId = company.id

  const [
    { data: reviews },
    { data: reviewSections },
    { data: jobs },
    { data: benefits },
  ] = await Promise.all([
    supabase.from('reviews_public').select('*').eq('company_id', companyId),
    // review_sections_public exposes company_id (not review_id), so filter by company
    supabase.from('review_sections_public').select('*').eq('company_id', companyId),
    supabase.from('jobs').select('*').eq('company_id', companyId).eq('is_active', true),
    supabase.from('company_benefits').select('*').eq('company_id', companyId),
  ])

  return (
    <CompanyDetailClient
      company={company}
      reviews={reviews ?? []}
      reviewSections={reviewSections ?? []}
      jobs={jobs ?? []}
      benefits={benefits ?? []}
    />
  )
}
