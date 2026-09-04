"use client";

import { useMemo, useState } from "react";

import {
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  FileText,
  Filter,
  GraduationCap,
  Search,
  Sparkles,
  Video,
  X,
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { adminResources } from "@/lib/adminDemoData";
import { useAdminDemoData } from "@/lib/useAdminDemoData";

type ResourceCategory =
  | "All"
  | "Applications"
  | "Interviews"
  | "CV & Cover Letter"
  | "Career Planning";

type ResourceType =
  | "Guide"
  | "Article"
  | "Video"
  | "Template";

type Resource = {
  id: string;
  title: string;
  description: string;
  category: Exclude<
    ResourceCategory,
    "All"
  >;
  type: ResourceType;
  featured?: boolean;
  source: string;
  url: string;
};

type AdminManagedResource = {
  id: string;
  title: string;
  category: string;
  type: string;
  status: string;
};

const resources: Resource[] = [
  {
    id: "resource-1",
    title:
      "How to Write a Strong Internship CV",
    description:
      "A practical guide to structuring a clear student CV and presenting skills, education, and experience effectively.",
    category: "CV & Cover Letter",
    type: "Guide",
    featured: true,
    source: "Career Centre",
    url: "#",
  },
  {
    id: "resource-2",
    title:
      "Preparing for Behavioural Interviews",
    description:
      "Learn how to answer common behavioural interview questions using a clear and structured approach.",
    category: "Interviews",
    type: "Guide",
    featured: true,
    source: "Career Centre",
    url: "#",
  },
  {
    id: "resource-3",
    title:
      "Internship Application Checklist",
    description:
      "Use this checklist before submitting an internship application to make sure important details are complete.",
    category: "Applications",
    type: "Template",
    featured: true,
    source: "Internship Tracker",
    url: "#",
  },
  {
    id: "resource-4",
    title:
      "Writing an Effective Cover Letter",
    description:
      "Understand how to tailor a cover letter to the organisation, position, and skills listed in a job advertisement.",
    category: "CV & Cover Letter",
    type: "Article",
    source: "Career Centre",
    url: "#",
  },
  {
    id: "resource-5",
    title:
      "STAR Interview Response Framework",
    description:
      "A concise overview of the STAR framework for answering experience-based interview questions.",
    category: "Interviews",
    type: "Video",
    source: "Student Careers",
    url: "#",
  },
  {
    id: "resource-6",
    title:
      "Researching a Company Before Applying",
    description:
      "Learn what information to research before applying and how company research can improve applications and interviews.",
    category: "Applications",
    type: "Article",
    source: "Career Centre",
    url: "#",
  },
  {
    id: "resource-7",
    title:
      "Graduate Career Planning Guide",
    description:
      "A starting point for identifying career goals, preferred industries, and graduate opportunities.",
    category: "Career Planning",
    type: "Guide",
    source: "Student Careers",
    url: "#",
  },
  {
    id: "resource-8",
    title:
      "Technical Interview Preparation",
    description:
      "Explore key preparation areas for technical internship and graduate interviews.",
    category: "Interviews",
    type: "Article",
    source: "Internship Tracker",
    url: "#",
  },
];

const categories: ResourceCategory[] = [
  "All",
  "Applications",
  "Interviews",
  "CV & Cover Letter",
  "Career Planning",
];

export default function ResourcesPage() {
  const [managedResourcesRaw] = useAdminDemoData(
    "admin-demo-resources",
    adminResources
  );

const managedResources =
  managedResourcesRaw as AdminManagedResource[];

    const visibleResources = useMemo<Resource[]>(
    () => [
      ...resources,
      ...managedResources
        .filter(
          (resource) =>
            resource.status === "Published"
        )
        .map(
          (resource): Resource => ({
            id: resource.id,
            title: resource.title,
            description:
              "Published by the Internship Tracker team.",
            category: (
              resource.category ===
              "CV & Cover Letters"
                ? "CV & Cover Letter"
                : resource.category
            ) as Resource["category"],
            type:
              resource.type as ResourceType,
            source: "Internship Tracker",
            url: "#",
          })
        ),
    ],
    [managedResources]
  );

  const [searchQuery, setSearchQuery] =
    useState("");

  const [
    selectedCategory,
    setSelectedCategory,
  ] =
    useState<ResourceCategory>("All");

  const [selectedType, setSelectedType] =
    useState<string>("All");

  const filteredResources = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    return visibleResources.filter(
      (resource) => {
        const matchesSearch =
          !query ||
          resource.title
            .toLowerCase()
            .includes(query) ||
          resource.description
            .toLowerCase()
            .includes(query) ||
          resource.source
            .toLowerCase()
            .includes(query);

        const matchesCategory =
          selectedCategory === "All" ||
          resource.category ===
            selectedCategory;

        const matchesType =
          selectedType === "All" ||
          resource.type === selectedType;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesType
        );
      }
    );
  }, [
    searchQuery,
    selectedCategory,
    selectedType,
    visibleResources,
  ]);

  const featuredResources =
    visibleResources.filter(
      (resource) => resource.featured
    );

  const filtersActive =
    searchQuery.trim() !== "" ||
    selectedCategory !== "All" ||
    selectedType !== "All";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedType("All");
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div>
          <p className="text-sm font-medium text-slate-500">
            Career support
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Resources
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Explore practical guides,
            templates, articles, and
            preparation materials to support
            your internship journey.
          </p>
        </div>

        {/* Featured */}
        <section className="mt-8">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-slate-500" />

            <h2 className="text-sm font-semibold text-slate-950">
              Featured resources
            </h2>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {featuredResources.map(
              (resource) => (
                <FeaturedResourceCard
                  key={resource.id}
                  resource={resource}
                />
              )
            )}
          </div>
        </section>

        {/* Search and filters */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-lg">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                placeholder="Search resources..."
                aria-label="Search resources"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <select
                  value={selectedCategory}
                  onChange={(event) =>
                    setSelectedCategory(
                      event.target
                        .value as ResourceCategory
                    )
                  }
                  aria-label="Filter by category"
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 sm:w-48"
                >
                  {categories.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    )
                  )}
                </select>
              </div>

              <select
                value={selectedType}
                onChange={(event) =>
                  setSelectedType(
                    event.target.value
                  )
                }
                aria-label="Filter by resource type"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 sm:w-40"
              >
                <option value="All">
                  All types
                </option>

                <option value="Guide">
                  Guide
                </option>

                <option value="Article">
                  Article
                </option>

                <option value="Video">
                  Video
                </option>

                <option value="Template">
                  Template
                </option>
              </select>

              {filtersActive && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  <X className="h-4 w-4" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Results heading */}
        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Career resources
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredResources.length}{" "}
              {filteredResources.length === 1
                ? "resource"
                : "resources"}{" "}
              available
            </p>
          </div>

          {selectedCategory !== "All" && (
            <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
              {selectedCategory}
            </span>
          )}
        </div>

        {/* Resource grid */}
        {filteredResources.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredResources.map(
              (resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                />
              )
            )}
          </div>
        ) : (
          <EmptyState
            onClear={clearFilters}
          />
        )}

        {/* Admin-managed notice */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200">
              <GraduationCap className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Resources are managed by
                the Internship Tracker team
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                New career guides,
                templates, and preparation
                materials can be published
                to this resource library as
                they become available.
              </p>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

type ResourceCardProps = {
  resource: Resource;
};

function ResourceCard({
  resource,
}: ResourceCardProps) {
  return (
    <article className="group flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <ResourceIcon
          type={resource.type}
        />

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
          {resource.type}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {resource.category}
        </p>

        <h3 className="mt-2 text-base font-semibold leading-6 text-slate-950">
          {resource.title}
        </h3>

        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
          {resource.description}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
        <p className="truncate text-xs text-slate-400">
          {resource.source}
        </p>

        <a
          href={resource.url}
          onClick={(event) => {
            if (
              resource.url === "#"
            ) {
              event.preventDefault();
            }
          }}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-slate-700 transition group-hover:text-slate-950"
        >
          Open
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  );
}

function FeaturedResourceCard({
  resource,
}: ResourceCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full border border-white/5" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-slate-200">
            <ResourceTypeIcon
              type={resource.type}
            />
          </div>

          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300">
            Featured
          </span>
        </div>

        <p className="mt-6 text-xs font-medium uppercase tracking-wide text-slate-500">
          {resource.category}
        </p>

        <h3 className="mt-2 text-lg font-semibold leading-7">
          {resource.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
          {resource.description}
        </p>

        <a
          href={resource.url}
          onClick={(event) => {
            if (
              resource.url === "#"
            ) {
              event.preventDefault();
            }
          }}
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white"
        >
          View resource

          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>
    </article>
  );
}

function ResourceIcon({
  type,
}: {
  type: ResourceType;
}) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
      <ResourceTypeIcon type={type} />
    </div>
  );
}

function ResourceTypeIcon({
  type,
}: {
  type: ResourceType;
}) {
  if (type === "Video") {
    return (
      <Video className="h-5 w-5" />
    );
  }

  if (type === "Template") {
    return (
      <FileText className="h-5 w-5" />
    );
  }

  if (type === "Article") {
    return (
      <BookOpen className="h-5 w-5" />
    );
  }

  return (
    <BriefcaseBusiness className="h-5 w-5" />
  );
}

function EmptyState({
  onClear,
}: {
  onClear: () => void;
}) {
  return (
    <div className="mt-4 flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Search className="h-5 w-5" />
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-950">
        No resources found
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        We couldn&apos;t find any
        resources matching your current
        search and filters.
      </p>

      <button
        type="button"
        onClick={onClear}
        className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        Clear filters
      </button>
    </div>
  );
}