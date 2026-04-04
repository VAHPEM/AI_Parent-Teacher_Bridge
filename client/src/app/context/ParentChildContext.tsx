import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../lib/api";

export interface ChildProfile {
  id: number;
  name: string;
  firstName: string;
  initials: string;
  color: string;
  year: string;
  class_name: string;
  teacher: string;
  school: string;
  overallGrade: string;
  attendance: string;
}

interface ParentChildContextType {
  activeChild: ChildProfile | null;
  children: ChildProfile[];
  setActiveChildId: (id: number) => void;
  loading: boolean;
}

const ParentChildContext = createContext<ParentChildContextType>({
  activeChild: null,
  children: [],
  setActiveChildId: () => {},
  loading: true,
});

export function ParentChildProvider({ children: reactChildren }: { children: React.ReactNode }) {
  const [children, setChildren]       = useState<ChildProfile[]>([]);
  const [activeChildId, setActiveChildId] = useState<number | null>(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    api.get<ChildProfile[]>("/parent/children").then((data) => {
      setChildren(data);
      if (data.length > 0) setActiveChildId(data[0].id);
    }).finally(() => setLoading(false));
  }, []);

  const activeChild = children.find((c) => c.id === activeChildId) ?? null;

  return (
    <ParentChildContext.Provider value={{ activeChild, children, setActiveChildId, loading }}>
      {reactChildren}
    </ParentChildContext.Provider>
  );
}

export function useActiveChild() {
  return useContext(ParentChildContext);
}
