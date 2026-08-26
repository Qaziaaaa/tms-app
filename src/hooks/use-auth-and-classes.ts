"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getClasses } from "@/lib/api";
import type { ClassDTO } from "@/types/api";

interface UseAuthAndClassesResult {
  session: ReturnType<typeof useSession>["data"];
  status: ReturnType<typeof useSession>["status"];
  classes: ClassDTO[];
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
  loading: boolean;
  loadingClasses: boolean;
  classError: string | null;
  refetchClasses: () => void;
}

export function useAuthAndClasses(preselectedClassId?: string): UseAuthAndClassesResult {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassDTO[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(preselectedClassId || "");
  const [loading, setLoading] = useState(true);
  const [classError, setClassError] = useState<string | null>(null);

  function fetchClasses() {
    setLoading(true);
    getClasses()
      .then((data) => {
        setClasses(data);
        setClassError(null);
        if (preselectedClassId) {
          setSelectedClassId(preselectedClassId);
        } else if (data.length > 0 && !selectedClassId) {
          setSelectedClassId(data[0].id);
        }
      })
      .catch(() => {
        setClasses([]);
        setClassError("Failed to load classes");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      let active = true;
      getClasses()
        .then((data) => {
          if (!active) return;
          setClasses(data);
          setClassError(null);
          if (preselectedClassId) {
            setSelectedClassId(preselectedClassId);
          } else if (data.length > 0 && !selectedClassId) {
            setSelectedClassId(data[0].id);
          }
        })
        .catch(() => {
          if (!active) return;
          setClasses([]);
          setClassError("Failed to load classes");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => { active = false; };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router, preselectedClassId]);

  return {
    session,
    status,
    classes,
    selectedClassId,
    setSelectedClassId,
    loading,
    loadingClasses: loading,
    classError,
    refetchClasses: fetchClasses,
  };
}
