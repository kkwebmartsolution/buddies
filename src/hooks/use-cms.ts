import { useEffect, useState } from "react";
import { defaultCmsData, type CmsData, deepMergeCmsData } from "@/lib/cms-defaults";

export function useCms(): CmsData {
  const [data, setData] = useState<CmsData>(defaultCmsData);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/content")
      .then((res) => res.json())
      .then((resData) => {
        if (isMounted && resData) {
          setData((prev) => deepMergeCmsData(prev, resData));
        }
      })
      .catch((err) => {
        console.warn("Could not fetch CMS data from API, using default content:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return data;
}
