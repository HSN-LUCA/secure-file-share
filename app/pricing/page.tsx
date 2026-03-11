'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PLAN_LIMITS } from '@/types';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface PlanInfo {
  name: string;
  description: string;
  price: string;
  period: string;
  features: PlanFeature[];
  cta: string;
  highlighted?: boolean;
}

const PLANS: Record<string, PlanInfo> = {
  free: {
    name: 'Free',
    description: 'Perfect for casual file sharing',
    price: '$0',
    period: 'forever',
    features: [
      { name: 'File size limit: 100MB', included: true },
      { name: 'Storage duration: 20 minutes', included: true },
      { name: 'Uploads: 5 per day', included: true },
      { name: 'Share history: Not included', included: false },
      { name: 'Download analytics: Not included', included: false },
      { name: 'Priority support: Not included', included: false },
    ],
    cta: 'Get Started',
  },
  paid: {
    name: 'Pro',
    description: 'For power users and professionals',
    price: '$4.99',
    period: 'month',
    features: [
      { name: 'File size limit: 1GB', included: true },
      { name: 'Storage duration: 24 hours', included: true },
      { name: 'Uploads: Unlimited', included: true },
      { name: 'Share history: Included', included: true },
      { name: 'Download analytics: Included', included: true },
      { name: 'Priority support: Included', included: true },
    ],
    cta: 'Upgrade to Pro',
    highlighted: true,
  },
  enterprise: {
    name: 'Enterprise',
    description: 'For organizations with custom needs',
    price: 'Custom',
    period: 'contact sales',
    features: [
      { name: 'File size limit: Up to 10GB', included: true },
      { name: 'Storage duration: Up to 30 days', included: true },
      { name: 'Uploads: Unlimited', included: true },
      { name: 'Share history: Included', included: true },
      { name: 'Download analytics: Included', included: true },
      { name: 'Priority support: Included', included: true },
      { name: 'Custom branding: Included', included: true },
      { name: 'API access: Included', included: true },
      { name: 'Dedicated support: Included', included: true },
    ],
    cta: 'Contact Sales',
  },
};

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="pt-12 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Choose the perfect plan for your file sharing needs
          </p>

          {/* Billing Toggle */}
          <div className="flex justify-center items-center gap-4 mb-12">
            <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-slate-900' : 'text-slate-600'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-8 w-14 items-center rounded-full bg-slate-300"
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                  billingPeriod === 'yearly' ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-slate-900' : 'text-slate-600'}`}>
              Yearly
              <span className="ml-2 inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                Save 20%
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid md:grid-cols-3 gap-8">
          {Object.entries(PLANS).map(([key, plan]) => (
            <div
              key={key}
              className={`relative rounded-lg shadow-lg overflow-hidden transition transform hover:scale-105 ${
                plan.highlighted
                  ? 'md:scale-105 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-500'
                  : 'bg-white border border-slate-200'
              }`}
            >
              {/* Highlighted Badge */}
              {plan.highlighted && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                  Most Popular
                </div>
              )}

              <div className="p-8">
                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-slate-600 text-sm mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    {plan.period !== 'contact sales' && (
                      <span className="text-slate-600">/{plan.period}</span>
                    )}
                  </div>
                  {billingPeriod === 'yearly' && key === 'paid' && (
                    <p className="text-sm text-green-600 mt-2">$49.99/year (save $10)</p>
                  )}
                </div>

                {/* CTA Button */}
                <Link
                  href={key === 'free' ? '/' : key === 'paid' ? '/dashboard' : '/enterprise'}
                  className={`block w-full py-3 px-4 rounded-lg font-semibold text-center transition mb-8 ${
                    plan.highlighted
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {plan.cta}
                </Link>

                {/* Features List */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-slate-900 mb-4">Features:</p>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                        feature.included
                          ? 'bg-green-100'
                          : 'bg-slate-100'
                      }`}>
                        {feature.included ? (
                          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm ${
                        feature.included ? 'text-slate-900' : 'text-slate-500'
                      }`}>
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-8 py-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Detailed Comparison</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-4 px-4 font-semibold text-slate-900">Feature</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-900">Free</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-900">Pro</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-900">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-4 px-4 text-slate-900 font-medium">Max File Size</td>
                    <td className="text-center py-4 px-4 text-slate-600">100 MB</td>
                    <td className="text-center py-4 px-4 text-slate-600">1 GB</td>
                    <td className="text-center py-4 px-4 text-slate-600">10 GB</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-4 px-4 text-slate-900 font-medium">Storage Duration</td>
                    <td className="text-center py-4 px-4 text-slate-600">20 minutes</td>
                    <td className="text-center py-4 px-4 text-slate-600">24 hours</td>
                    <td className="text-center py-4 px-4 text-slate-600">30 days</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-4 px-4 text-slate-900 font-medium">Daily Uploads</td>
                    <td className="text-center py-4 px-4 text-slate-600">5</td>
                    <td className="text-center py-4 px-4 text-slate-600">Unlimited</td>
                    <td className="text-center py-4 px-4 text-slate-600">Unlimited</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-4 px-4 text-slate-900 font-medium">Share History</td>
                    <td className="text-center py-4 px-4">
                      <svg className="w-5 h-5 text-slate-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </td>
                    <td className="text-center py-4 px-4">
                      <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </td>
                    <td className="text-center py-4 px-4">
                      <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-4 px-4 text-slate-900 font-medium">Analytics</td>
                    <td className="text-center py-4 px-4">
                      <svg className="w-5 h-5 text-slate-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </td>
                    <td className="text-center py-4 px-4">
                      <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </td>
                    <td className="text-center py-4 px-4">
                      <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-4 px-4 text-slate-900 font-medium">Priority Support</td>
                    <td className="text-center py-4 px-4">
                      <svg className="w-5 h-5 text-slate-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </td>
                    <td className="text-center py-4 px-4">
                      <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </td>
                    <td className="text-center py-4 px-4">
                      <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-slate-900 font-medium">Custom Branding</td>
                    <td className="text-center py-4 px-4">
                      <svg className="w-5 h-5 text-slate-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </td>
                    <td className="text-center py-4 px-4">
                      <svg className="w-5 h-5 text-slate-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </td>
                    <td className="text-center py-4 px-4">
                      <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Can I upgrade or downgrade my plan?</h3>
            <p className="text-slate-600">Yes, you can change your plan at any time. Changes take effect immediately.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">What payment methods do you accept?</h3>
            <p className="text-slate-600">We accept all major credit cards through Stripe. Invoicing is available for enterprise customers.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Is there a free trial for Pro?</h3>
            <p className="text-slate-600">Yes, we offer a 7-day free trial for new Pro users. No credit card required.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">What happens to my files if I downgrade?</h3>
            <p className="text-slate-600">Your existing files remain accessible until they expire. New uploads will follow your new plan's limits.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
