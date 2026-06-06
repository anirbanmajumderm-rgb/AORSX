import { useState, useEffect, useCallback, useRef } from "react";

interface Company {
  id: number;
  name: string;
  tagline: string;
  description: string | null;
  aboutText: string | null;
  vision: string | null;
  mission: string | null;
  logo: string | null;
  favicon: string | null;
  founderName: string | null;
  founderRole: string | null;
  founderBio: string | null;
  founderImage: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  linkedin: string | null;
  twitter: string | null;
  github: string | null;
}

interface Service {
  id: number;
  title: string;
  description: string | null;
  icon: string | null;
  order: number;
  isActive: boolean;
}

interface Project {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  technologies: string | null;
  clientName: string | null;
  companyName: string | null;
  projectUrl: string | null;
  image: string | null;
  featured: boolean;
  order: number;
  isActive: boolean;
}

interface Review {
  id: number;
  projectId: number;
  reviewerName: string;
  reviewerEmail: string | null;
  rating: number;
  reviewText: string | null;
  isApproved: boolean;
  isSpam: boolean;
  createdAt: string;
}

interface FAQ {
  id: number;
  question: string;
  answer: string | null;
  order: number;
  isActive: boolean;
}

interface Skill {
  id: number;
  category: string;
  name: string;
  proficiency: number;
  icon: string | null;
  order: number;
  isActive: boolean;
}

interface WhyChooseMe {
  id: number;
  title: string;
  description: string | null;
  icon: string | null;
  order: number;
  isActive: boolean;
}

interface Contact {
  id: number;
  type: string;
  value: string;
  label: string | null;
  icon: string | null;
  order: number;
  isActive: boolean;
}

interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string | null;
  photo: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  twitter: string | null;
  github: string | null;
  displayOrder: number;
  isFounder: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Settings {
  [key: string]: string | null;
}

export interface SiteData {
  services: Service[];
  projects: Project[];
  reviews: Review[];
  faq: FAQ[];
  settings: Settings;
  company: Company | null;
  skills: Skill[];
  whyChooseMe: WhyChooseMe[];
  contacts: Contact[];
  featureFlags: Record<string, boolean>;
  teamMembers: TeamMember[];
}

interface UseSiteDataResult {
  data: SiteData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const defaultData: SiteData = {
  services: [],
  projects: [],
  reviews: [],
  faq: [],
  settings: {},
  company: null,
  skills: [],
  whyChooseMe: [],
  contacts: [],
  featureFlags: {},
  teamMembers: [],
};

export function useSiteData(): UseSiteDataResult {
  const [data, setData] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef(false);

  const fetchData = useCallback(async () => {
    cancelRef.current = false;
    setLoading(true);
    try {
      const res = await fetch("/api/site-data");
      const json = await res.json();
      if (!cancelRef.current) {
        if (json.success) {
          setData(json.data);
          setError(null);
        } else {
          setError(json.error || "Failed to load site data");
        }
      }
    } catch (err) {
      if (!cancelRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch site data");
      }
    } finally {
      if (!cancelRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    return () => {
      cancelRef.current = true;
    };
  }, [fetchData]);

  return { data: data || defaultData, loading, error, refetch: fetchData };
}
