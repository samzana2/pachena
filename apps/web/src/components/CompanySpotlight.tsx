"use client";

import Link from 'next/link';
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import StarRating from "@/components/StarRating";
import { useRef, useCallback } from "react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import type { EmblaCarouselType } from "embla-carousel";

interface SpotlightCompany {
  id: string;
  name: string;
  logo?: string;
  description: string;
  rating: number;
}

interface CompanySpotlightProps {
  companies: SpotlightCompany[];
}

const CompanySpotlight = ({
  companies
}: CompanySpotlightProps) => {
  const emblaRef = useRef<EmblaCarouselType | null>(null);

  const scrollPrev = useCallback(() => {
    if (emblaRef.current) emblaRef.current.scrollPrev();
  }, []);

  const scrollNext = useCallback(() => {
    if (emblaRef.current) emblaRef.current.scrollNext();
  }, []);

  const displayCompanies = companies;

  const CompanyCard = ({ company }: { company: SpotlightCompany }) => (
    <div className="h-full rounded-3xl border border-black p-6 flex flex-col justify-between min-h-[340px]">
      <div>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary border border-border">
          {company.logo ? (
            <img src={company.logo} alt={company.name} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-foreground">
              {company.name.charAt(0)}
            </span>
          )}
        </div>
        <p className="text-black/70 text-base leading-relaxed line-clamp-3 mb-3">
          {company.description}
        </p>
        <h4 className="font-semibold text-black">{company.name}</h4>
        <StarRating rating={company.rating} size="sm" className="mt-2" />
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        asChild 
        className="mt-4 w-fit"
      >
        <Link href={`/company/${company.id}`}>
          View Company Page
        </Link>
      </Button>
    </div>
  );

  return (
    <div>
      {/* Mobile Layout - Stacked */}
      <div className="md:hidden">
        <div className="mb-8">
          <h3 className="font-logo text-3xl text-brand mb-2">Pachena</h3>
          <h2 className="text-3xl font-medium text-black mb-3">
            Top Rated Companies
          </h2>
          <p className="text-black/70 text-base leading-relaxed">
            See what employees are saying about the best places to work.
          </p>
          <Link 
            href="/companies"
            className="mt-2 inline-block text-sm text-black hover:underline font-medium"
          >
            View all companies →
          </Link>
        </div>
        <div className="flex flex-col gap-4">
          {displayCompanies.slice(0, 3).map(company => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      </div>

      {/* Desktop Layout - Side by Side */}
      <div className="hidden md:block">
        <div className="flex gap-8 items-stretch">
          {/* Left Side - Heading and Navigation */}
          <div className="w-72 shrink-0 flex flex-col py-4">
            <div>
              <h3 className="font-logo text-3xl text-brand mb-2">Pachena</h3>
              <h2 className="text-3xl md:text-4xl font-medium text-black mb-3">
                Top Rated Companies
              </h2>
              <p className="text-black/70 text-base leading-relaxed">
                See what employees are saying about the best places to work.
              </p>
              <Link 
                href="/companies"
                className="mt-2 inline-block text-sm text-black hover:underline font-medium"
              >
                View all companies →
              </Link>
              
              {/* Navigation Arrows */}
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={scrollPrev}
                  className="w-14 h-14 rounded-full bg-brand flex items-center justify-center hover:bg-brand/90 transition-colors"
                >
                  <ArrowLeft className="w-6 h-6 text-brand-foreground" />
                </button>
                <button 
                  onClick={scrollNext}
                  className="w-14 h-14 rounded-full bg-brand flex items-center justify-center hover:bg-brand/90 transition-colors"
                >
                  <ArrowRight className="w-6 h-6 text-brand-foreground" />
                </button>
              </div>
            </div>
          </div>

          {/* Carousel */}
          <Carousel
            opts={{
              align: "start",
              loop: true
            }}
            className="flex-1 overflow-hidden"
            setApi={(api) => { emblaRef.current = api as unknown as EmblaCarouselType; }}
          >
            <CarouselContent className="-ml-4">
              {displayCompanies.map(company => (
                <CarouselItem key={company.id} className="basis-1/2 pl-4">
                  <CompanyCard company={company} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </div>
  );
};

export default CompanySpotlight;