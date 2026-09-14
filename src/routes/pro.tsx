import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@tanstack/react-store';
import { store, storeActions } from '../store';

const ProPage = () => {
  const navigate = useNavigate();
  const state = useStore(store);
  const isPro = state.isPro;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 font-sans text-gray-900">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">
          Upgrade to Splitz Pro
        </h1>
        <p className="text-lg text-gray-600">
          Manage your expenses without limits. Professional tools for organized groups.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {/* Free Tier */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Free</h2>
          <div className="text-3xl font-bold mb-6">$0 <span className="text-sm font-normal text-gray-500">/ forever</span></div>

          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3 text-gray-600">
              <span className="text-green-500">✓</span> 5 expenses per group
            </li>
            <li className="flex items-center gap-3 text-gray-600">
              <span className="text-green-500">✓</span> Basic splitting modes
            </li>
            <li className="flex items-center gap-3 text-gray-600">
              <span className="text-green-500">✓</span> CSV Export
            </li>
            <li className="flex items-center gap-3 text-gray-400 line-through">
              <span className="text-gray-300">✓</span> Unlimited expenses
            </li>
            <li className="flex items-center gap-3 text-gray-400 line-through">
              <span className="text-gray-300">✓</span> Advanced AI Insights
            </li>
          </ul>

          <button
            disabled={!isPro}
            className={`w-full py-3 rounded-xl font-bold transition-all ${
              isPro
                ? 'bg-gray-100 text-gray-400 cursor-default'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isPro ? 'Current Plan' : 'Current Plan'}
          </button>
        </div>

        {/* Pro Tier */}
        <div className="bg-blue-50 border-2 border-blue-500 rounded-2xl p-8 shadow-lg flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
            RECOMMENDED
          </div>
          <h2 className="text-2xl font-bold text-blue-800 mb-2">Pro</h2>
          <div className="text-3xl font-bold mb-6 text-blue-900">$4.99 <span className="text-sm font-normal text-blue-600">/ month</span></div>

          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3 text-gray-700">
              <span className="text-blue-500 font-bold">✓</span> Unlimited expenses
            </li>
            <li className="flex items-center gap-3 text-gray-700">
              <span className="text-blue-500 font-bold">✓</span> All splitting modes
            </li>
            <li className="flex items-center gap-3 text-gray-700">
              <span className="text-blue-500 font-bold">✓</span> Priority CSV Export
            </li>
            <li className="flex items-center gap-3 text-gray-700">
              <span className="text-blue-500 font-bold">✓</span> Advanced AI Insights
            </li>
            <li className="flex items-center gap-3 text-gray-700">
              <span className="text-blue-500 font-bold">✓</span> Premium Support
            </li>
          </ul>

          <button
            onClick={() => {
              storeActions.setProStatus(true);
              navigate('/');
            }}
            disabled={isPro}
            className={`w-full py-3 rounded-xl font-bold transition-all ${
              isPro
                ? 'bg-blue-200 text-blue-500 cursor-default'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'
            }`}
          >
            {isPro ? 'You are a Pro member!' : 'Upgrade to Pro'}
          </button>
        </div>
      </div>

      {/* Demo Toggle */}
      <div className="mt-16 text-center">
        <div className="inline-flex items-center gap-3 p-2 bg-gray-100 rounded-full border border-gray-200">
          <span className="text-xs text-gray-500 px-2">Developer Mode:</span>
          <button
            onClick={() => storeActions.setProStatus(!isPro)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPro ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPro ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
          <span className="text-xs font-medium text-gray-600 px-2">
            {isPro ? 'Pro Enabled' : 'Free Mode'}
          </span>
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default ProPage;
