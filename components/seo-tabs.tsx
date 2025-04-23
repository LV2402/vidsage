"use client";

import React from "react";
import { CheckCircle2, XCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useState } from "react";

export function TabsContainer({ results }: any) {
  const [activeTab, setActiveTab] = useState("issues");

  return (
    <div className="neo-card bg-white -rotate-1">
      <div className="tabs flex border-b-4 border-black">
        <button
          className={`tab-button py-3 px-6 font-bold text-lg uppercase ${
            activeTab === "issues" ? "bg-[#FF5757] text-white" : ""
          } neo-border border-b-0 -mb-[4px]`}
          onClick={() => setActiveTab("issues")}
        >
          Issues ({results.issues.length})
        </button>
        <button
          className={`tab-button py-3 px-6 font-bold text-lg uppercase ${
            activeTab === "recommendations" ? "bg-[#FF5757] text-white" : ""
          }`}
          onClick={() => setActiveTab("recommendations")}
        >
          Recommendations
        </button>
        <button
          className={`tab-button py-3 px-6 font-bold text-lg uppercase ${
            activeTab === "details" ? "bg-[#FF5757] text-white" : ""
          }`}
          onClick={() => setActiveTab("details")}
        >
          Details
        </button>
      </div>

      {activeTab === "issues" && (
        <div className="tab-content p-6 space-y-6">
          {results.issues.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-[#00C853] mx-auto mb-4" />
              <p className="text-2xl font-bold">No critical issues found!</p>
              <p className="text-lg">
                Your website is doing well, but check the recommendations for
                further improvements.
              </p>
            </div>
          ) : (
            results.issues.map(
              (
                issue: {
                  title: string;
                  description: string;
                  severity: "high" | "medium" | "low";
                },
                index: number
              ) => (
                <IssueCard
                  key={index}
                  issue={issue}
                  rotation={index % 2 === 0 ? "rotate-1" : "-rotate-1"}
                />
              )
            )
          )}
        </div>
      )}

      {activeTab === "recommendations" && (
        <div className="tab-content p-6 space-y-6">
          {results.recommendations.map(
            (
              recommendation: {
                title: string;
                description: string;
                impact: "high" | "medium" | "low";
              },
              index: number
            ) => (
              <RecommendationCard
                key={index}
                recommendation={recommendation}
                rotation={index % 2 === 0 ? "-rotate-1" : "rotate-1"}
              />
            )
          )}
        </div>
      )}

      {activeTab === "details" && (
        <div className="tab-content p-6 space-y-8">
          <DetailSection title="Meta Tags" items={results.metaTagsDetails} />
          <DetailSection
            title="Content Analysis"
            items={results.contentDetails}
          />
          <DetailSection
            title="Technical SEO"
            items={results.technicalDetails}
          />
        </div>
      )}
    </div>
  );
}

function IssueCard({
  issue,
  rotation,
}: {
  issue: {
    title: string;
    description: string;
    severity: "high" | "medium" | "low";
  };
  rotation: string;
}) {
  const severityIcon = {
    high: <XCircle className="h-6 w-6 text-[#FF5757]" />,
    medium: <AlertCircle className="h-6 w-6 text-[#FFB300]" />,
    low: <AlertCircle className="h-6 w-6 text-[#3D5AFE]" />,
  };

  const severityBg = {
    high: "bg-[#FF5757]",
    medium: "bg-[#FFB300]",
    low: "bg-[#3D5AFE]",
  };

  return (
    <div className={`neo-card ${rotation}`}>
      <div className="flex items-start gap-4 mb-3">
        {severityIcon[issue.severity]}
        <div>
          <h3 className="text-xl font-bold">{issue.title}</h3>
          <div
            className={`neo-badge ${
              severityBg[issue.severity]
            } text-white mt-1`}
          >
            {issue.severity.toUpperCase()} PRIORITY
          </div>
        </div>
      </div>
      <p className="font-medium">{issue.description}</p>
    </div>
  );
}

function RecommendationCard({
  recommendation,
  rotation,
}: {
  recommendation: {
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
  };
  rotation: string;
}) {
  const impactBg = {
    high: "bg-[#00C853]",
    medium: "bg-[#3D5AFE]",
    low: "bg-[#757575]",
  };

  return (
    <div className={`neo-card ${rotation}`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-bold">{recommendation.title}</h3>
        <div
          className={`neo-badge ${impactBg[recommendation.impact]} text-white`}
        >
          {recommendation.impact.toUpperCase()} IMPACT
        </div>
      </div>
      <p className="font-medium">{recommendation.description}</p>
    </div>
  );
}

function DetailSection({
  title,
  items,
}: {
  title: string;
  items: { name: string; value: string; status: "good" | "warning" | "bad" }[];
}) {
  const statusIcon = {
    good: <CheckCircle2 className="h-5 w-5 text-[#00C853]" />,
    warning: <AlertCircle className="h-5 w-5 text-[#FFB300]" />,
    bad: <XCircle className="h-5 w-5 text-[#FF5757]" />,
  };

  return (
    <div className="neo-card rotate-1">
      <h3 className="text-2xl font-bold mb-4 uppercase">{title}</h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-start justify-between py-2 border-b-4 border-black last:border-0"
          >
            <div className="flex items-center gap-2">
              {statusIcon[item.status]}
              <span className="font-bold text-lg">{item.name}</span>
            </div>
            <div className="font-medium max-w-[60%] text-right">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
