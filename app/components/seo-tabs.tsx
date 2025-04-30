"use client";

import React from "react";
import { CheckCircle2, XCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useState } from "react";

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

  const severityLabel = {
    high: "Critical Issue",
    medium: "Moderate Issue",
    low: "Minor Issue"
  };

  return (
    <div className={`neo-card ${rotation}`}>
      <div className="flex items-start gap-4 mb-3">
        {severityIcon[issue.severity]}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-xl font-bold">{issue.title}</h3>
            <div className={`neo-badge ${severityBg[issue.severity]} text-white text-sm`}>
              {severityLabel[issue.severity]}
            </div>
          </div>
          <p className="font-medium text-gray-800">{issue.description}</p>
        </div>
      </div>
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

  const impactLabel = {
    high: "HIGH IMPACT",
    medium: "MEDIUM IMPACT",
    low: "LOW IMPACT"
  };

  return (
    <div className={`neo-card ${rotation}`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-bold">{recommendation.title}</h3>
        <div className={`neo-badge ${impactBg[recommendation.impact]} text-white`}>
          {impactLabel[recommendation.impact]}
        </div>
      </div>
      <p className="font-medium text-gray-800">{recommendation.description}</p>
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

  const statusClass = {
    good: "text-[#00C853]",
    warning: "text-[#FFB300]",
    bad: "text-[#FF5757]",
  };

  return (
    <div className="neo-card rotate-1">
      <h3 className="text-2xl font-bold mb-4 uppercase">{title}</h3>
      {items.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded">
          <p className="text-gray-500">No details available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-start justify-between py-2 border-b-4 border-black last:border-0"
            >
              <div className="flex items-start gap-2 max-w-[60%]">
                {statusIcon[item.status]}
                <span className="font-bold text-lg">{item.name}</span>
              </div>
              <div className={`font-medium max-w-[40%] text-right ${statusClass[item.status]}`}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TabsContainer({ results }: any) {
  const [activeTab, setActiveTab] = useState("issues");

  return (
    <div className="neo-card bg-white">
      <div className="flex border-b-4 border-black">
        <button
          className={`flex-1 p-4 font-bold text-lg ${
            activeTab === "issues" ? "bg-[#FF5757] text-white" : ""
          }`}
          onClick={() => setActiveTab("issues")}
        >
          Issues ({results.issues.length})
        </button>
        <button
          className={`flex-1 p-4 font-bold text-lg ${
            activeTab === "recommendations" ? "bg-[#00C853] text-white" : ""
          }`}
          onClick={() => setActiveTab("recommendations")}
        >
          Fixes ({results.recommendations.length})
        </button>
        <button
          className={`flex-1 p-4 font-bold text-lg ${
            activeTab === "details" ? "bg-[#3D5AFE] text-white" : ""
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
                Your website is performing well, but check the recommendations for
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
          {results.recommendations.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-[#00C853] mx-auto mb-4" />
              <p className="text-2xl font-bold">No recommendations needed!</p>
              <p className="text-lg">
                Your website is already optimized according to best practices.
              </p>
            </div>
          ) : (
            results.recommendations.map(
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
            )
          )}
        </div>
      )}

      {activeTab === "details" && (
        <div className="tab-content p-6 space-y-6">
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
