'use client'

import React, { useState } from 'react'
import { Icone } from '@/componentes/ui/icone'
import type { IconName } from '@/componentes/ui/icone'

interface Tab {
  id: string
  label: string
  icon?: IconName
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  children: React.ReactNode
}

interface TabPanelProps {
  id: string
  activeTab: string
  children: React.ReactNode
}

/**
 * Componente Tabs profissional
 * Baseado no design system estabelecido
 */
export function Tabs({ tabs, activeTab, onTabChange, children }: TabsProps) {
  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group inline-flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon && (
                <Icone 
                  name={tab.icon} 
                  className={`w-4 h-4 transition-all duration-200 ${
                    activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} 
                />
              )}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800 group-hover:bg-gray-200'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-8 animate-in fade-in-0 duration-300">
        {children}
      </div>
    </div>
  )
}

/**
 * Componente para conteúdo de cada tab
 */
export function TabPanel({ id, activeTab, children }: TabPanelProps) {
  if (id !== activeTab) return null

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      {children}
    </div>
  )
}