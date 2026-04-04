import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../lib/api";
import { DEMO_PARENT_ID } from "../lib/config";

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
interface Parent {
  id: number;
  name: string;
  initials: string;
  color: string;
}
interface ParentChildContextType {
  activeChild: ChildProfile | null;
  children: ChildProfile[];
  setActiveChildId: (id: number) => void;
  loading: boolean;
  parent: Parent ;
}

const ParentChildContext = createContext<ParentChildContextType>({
  activeChild: null,
  children: [],
  setActiveChildId: () => {},
  loading: true,
  parent: {
    id: 0,
    name: "",
    initials: "",
    color: ""
  }
});

export function ParentChildProvider({ children: reactChildren }: { children: React.ReactNode }) {
  const [children, setChildren]       = useState<ChildProfile[]>([]);
  const [activeChildId, setActiveChildId] = useState<number | null>(null);
  const [loading, setLoading]         = useState(true);
  const [parent, setParent]           = useState<Parent>({
    id: 0,
    name: "",
    initials: "",
    color: ""
  });
  useEffect(() => {
    // Close sidebar on route change (for mobile)
    api.get<Parent>(`/parent/info/${DEMO_PARENT_ID}`).then(data => {
          setParent(data);
          console.log("Fetched parent info:", data);
        });
    api.get<ChildProfile[]>(`/parent/children?parent_id=${DEMO_PARENT_ID}`).then((data) => {
      setChildren(data);
      if (data.length > 0) setActiveChildId(data[0].id);
    }).finally(() => setLoading(false));
  }, []);
  

  const activeChild = children.find((c) => c.id === activeChildId) ?? null;

  return (
    <ParentChildContext.Provider value={{ activeChild, children, setActiveChildId, loading, parent}}>
      {reactChildren}
    </ParentChildContext.Provider>
  );
}

export function useParentChild() {
  return useContext(ParentChildContext);
}
