import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { api } from "../lib/api";
import { DEMO_PARENT_ID } from "../lib/config";

export interface Parent {
  id: number;
  name: string;
  initials: string;
  color: string;
}

/** Child row from `/parent/children` plus `studentId` for chat/report APIs. */
export interface ChildProfile {
  id: number;
  studentId: number;
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
  parent: Parent;
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
    color: "",
  },
});

function mapChild(c: ChildProfile & { studentId?: number }): ChildProfile {
  const sid = c.studentId ?? c.id;
  return {
    ...c,
    studentId: sid,
    firstName: c.firstName || c.name.split()[0] || c.name,
  };
}

export function ParentChildProvider({ children: reactChildren }: { children: ReactNode }) {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [activeChildId, setActiveChildId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [parent, setParent] = useState<Parent>({
    id: 0,
    name: "",
    initials: "",
    color: "",
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<Parent>(`/parent/info/${DEMO_PARENT_ID}`)
      .then((data) => {
        if (!cancelled) setParent(data);
      })
      .catch(() => {
        if (!cancelled) {
          setParent({ id: 0, name: "", initials: "", color: "" });
        }
      });

    api
      .get<ChildProfile[]>(`/parent/children?parent_id=${DEMO_PARENT_ID}`)
      .then((data) => {
        if (cancelled) return;
        const mapped = (Array.isArray(data) ? data : []).map((row) =>
          mapChild(row as ChildProfile & { studentId?: number })
        );
        setChildren(mapped);
        if (mapped.length > 0) setActiveChildId(mapped[0].id);
        else setActiveChildId(null);
      })
      .catch(() => {
        if (!cancelled) {
          setChildren([]);
          setActiveChildId(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeChild = children.find((c) => c.id === activeChildId) ?? null;

  return (
    <ParentChildContext.Provider
      value={{ activeChild, children, setActiveChildId, loading, parent }}
    >
      {reactChildren}
    </ParentChildContext.Provider>
  );
}

export function useParentChild() {
  return useContext(ParentChildContext);
}