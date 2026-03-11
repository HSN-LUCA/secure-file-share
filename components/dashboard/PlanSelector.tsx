'use client';

/**
 * Plan Selector Component
 * Displays current plan and upgrade options
 */

import React from 'react';
import Link from 'next/link';
import { PLAN_LIMITS, UserPlan } from '@/types';

interface PlanSelectorProps {
  currentPlan: UserPlan;
  subscriptionExpiresAt?: string;
}

export default function PlanSelector({ currentPlan, subscriptionExpiresAt }: PlanSelectorProps) {
  const planLimits = PLAN_LIMITS[currentPlan];
  const isExpired = subscriptionExpiresAt && new Date(subscriptionExpiresAt) < new Date();

  const getPlanColor = (plan: UserPlan) => {
    switch (plan) {
      case 'free':
        return 'bg-slate-100 border-slate-300';
      case 'paid':
        return 'bg-blue-100 border-blue-300';
      case 'enterprise':
        return 'bg-purple-100 border-purple-300';
      default:
        return 'bg-slate-100 border-slate-300';
    }
  };

  const getPlanBadgeColor = (plan: UserPlan) => {
    switch (plan) {
      case 'free':
        return 'bg-slate-200 text-slate-800';
      case 'paid':
        return 'bg-blue-200 text-blue-800';
      case 'enterprise':
        return 'bg-purple-200 text-purple-800';
      default:
        return 'bg-slate-200 text-slate-800';
    }
  };

  return (
    <div className={`rounded-lg border-2 p-6 ${getPlanColor(currentPlan)}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Current Plan</h3>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getPlanBadgeColor(currentPlan)}`}>
              {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            </span>
            {isExpired && (
              <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-red-200 text-red-800">
                Expired
              </span>
            )}
          </div>
        </div>
        {currentPlan !== 'enterprise' && (
          <Link
            href="/pricing"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline"
          >
            View Plans
          </Link>
        )}
      </div>

      {/* Plan Limits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded p-4">
          <p className="text-sm text-slate-600 mb-1">Max File Size</p>
          <p className="text-lg font-semibold text-slate-900">
            {Math.round(planLimits.maxFileSize / (1024 * 1024 * 1024)) > 0
              ? `${Math.round(planLimits.maxFileSize / (1024 * 1024 * 1024))} GB`
              : `${Math.round(planLimits.maxFileSize / (1024 * 1024))} MB`}
          </p>
        </div>

        <div className="bg-white rounded p-4">
          <p className="text-sm text-slate-600 mb-1">Storage Duration</p>
          <p className="text-lg font-semibold text-slate-900">
            {planLimits.storageDurationMinutes < 60
              ? `${planLimits.storageDurationMinutes} min`
              : planLimits.storageDurationMinutes < 1440
              ? `${Math.round(planLimits.storageDurationMinutes / 60)} hours`
              : `${Math.round(planLimits.storageDurationMinutes / 1440)} days`}
          </p>
        </div>

        <div className="bg-white rounded p-4">
          <p className="text-sm text-slate-600 mb-1">Daily Uploads</p>
          <p className="text-lg font-semibold text-slate-900">
            {planLimits.uploadsPerDay === Infinity ? 'Unlimited' : planLimits.uploadsPerDay}
          </p>
        </div>
      </div>

      {/* Subscription Info */}
      {subscriptionExpiresAt && currentPlan !== 'free' && (
        <div className="bg-white rounded p-4 mb-6">
          <p className="text-sm text-slate-600 mb-1">Subscription Expires</p>
          <p className="text-slate-900 font-medium">
            {new Date(subscriptionExpiresAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          {isExpired && (
            <p className="text-sm text-red-600 mt-2">
              Your subscription has expired. Upgrade to continue using premium features.
            </p>
          )}
        </div>
      )}

      {/* CTA */}
      {currentPlan === 'free' && (
        <Link
          href="/pricing"
          className="block w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg text-center hover:bg-blue-700 transition"
        >
          Upgrade to Pro
        </Link>
      )}

      {currentPlan === 'paid' && isExpired && (
        <Link
          href="/pricing"
          className="block w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg text-center hover:bg-blue-700 transition"
        >
          Renew Subscription
        </Link>
      )}

      {currentPlan === 'enterprise' && (
        <a
          href="mailto:sales@example.com"
          className="block w-full bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg text-center hover:bg-purple-700 transition"
        >
          Contact Support
        </a>
      )}
    </div>
  );
}
