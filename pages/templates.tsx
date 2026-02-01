import { useState, useEffect } from "react";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { Search, Filter } from 'lucide-react';
import { Button } from "@/components/Button";
import { TemplateCard, TemplateCardSkeleton, Template } from "@/components/TemplateCard";
import TemplateDetailModal from "@/components/TemplateDetailModal";
import ThemeToggle from '@/components/ThemeToggle';
import ProfileDropdown from "@/components/ProfileDropdown";
import { TEMPLATE_CATEGORIES } from "@/lib/template-utils";

export default function TemplatesPage() {
  const { data: session, status } = useSession();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVisibility, setSelectedVisibility] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Detail modal
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [selectedCategory, selectedVisibility, searchQuery]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      if (selectedVisibility !== 'all') {
        params.append('visibility', selectedVisibility);
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(`/api/templates?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates || []);
      } else {
        setError(data.message || 'Failed to load templates');
      }
    } catch (err) {
      setError('Failed to load templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewTemplate = async (template: Template) => {
    // Fetch full template details
    try {
      const response = await fetch(`/api/templates/${template.id}`);
      const data = await response.json();

      if (data.success && data.template) {
        setSelectedTemplate(data.template);
        setShowDetailModal(true);
      } else {
        alert(data.message || 'Failed to load template details');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load template details');
    }
  };

  const handleUseTemplate = async (template: Template) => {
    // Open detail modal which handles the actual usage
    await handlePreviewTemplate(template);
  };

  return (
    <>
      <Head>
        <title>Template Marketplace | ZeitFlow</title>
        <meta name="description" content="Browse and use workflow templates" />
      </Head>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-background-light border-b border-primary/10 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-foreground">Template Marketplace</h1>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                {status === 'authenticated' ? (
                  <ProfileDropdown />
                ) : (
                  <Button href="/api/auth/signin" variant="primary" size="sm">
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Filters - Desktop */}
            <aside className="hidden lg:block lg:w-64 flex-shrink-0">
              <div className="sticky top-24 space-y-6">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-light" size={16} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search templates..."
                      className="w-full pl-10 pr-3 py-2 bg-background-extra-light border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-background-extra-light border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                  >
                    <option value="all">All Categories</option>
                    {TEMPLATE_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Visibility Filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Visibility
                  </label>
                  <select
                    value={selectedVisibility}
                    onChange={(e) => setSelectedVisibility(e.target.value)}
                    className="w-full px-3 py-2 bg-background-extra-light border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                  >
                    <option value="all">All Templates</option>
                    <option value="official">Official</option>
                    <option value="public">Community</option>
                    {session && <option value="private">My Private</option>}
                  </select>
                </div>

                {/* Quick Links */}
                {session && (
                  <div className="pt-4 border-t border-primary/10">
                    <Button
                      href="/dashboard?tab=workflows"
                      variant="tertiary"
                      className="w-full justify-start"
                    >
                      My Workflows
                    </Button>
                  </div>
                )}
              </div>
            </aside>

            {/* Mobile Filters Toggle */}
            <div className="lg:hidden">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="tertiary"
                className="w-full mb-4"
              >
                <Filter size={16} />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>

              {showFilters && (
                <div className="space-y-4 mb-6 p-4 bg-background-light rounded-lg">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Search
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-light" size={16} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search templates..."
                        className="w-full pl-10 pr-3 py-2 bg-background-extra-light border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-background-extra-light border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    >
                      <option value="all">All Categories</option>
                      {TEMPLATE_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Visibility */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Visibility
                    </label>
                    <select
                      value={selectedVisibility}
                      onChange={(e) => setSelectedVisibility(e.target.value)}
                      className="w-full px-3 py-2 bg-background-extra-light border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    >
                      <option value="all">All Templates</option>
                      <option value="official">Official</option>
                      <option value="public">Community</option>
                      {session && <option value="private">My Private</option>}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              {/* Results Header */}
              <div className="mb-6">
                <p className="text-foreground-light">
                  {loading ? (
                    'Loading templates...'
                  ) : (
                    `${templates.length} template${templates.length !== 1 ? 's' : ''} found`
                  )}
                </p>
              </div>

              {/* Error State */}
              {error && (
                <div className="p-4 bg-red-100 border border-red-300 text-red-800 rounded-md mb-6">
                  {error}
                </div>
              )}

              {/* Templates Grid */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <TemplateCardSkeleton key={i} />
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No templates found
                  </h3>
                  <p className="text-foreground-light mb-6">
                    Try adjusting your filters or search query
                  </p>
                  {session && (
                    <Button
                      href="/dashboard?tab=workflows"
                      variant="primary"
                    >
                      Create Your Own Workflow
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {templates.map(template => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onPreview={handlePreviewTemplate}
                      onUse={handleUseTemplate}
                    />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Template Detail Modal */}
      <TemplateDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
      />
    </>
  );
}
