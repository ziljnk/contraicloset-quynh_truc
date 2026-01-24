"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "@/utils/firebase";

export default function TestFirebasePage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, "outfits"), limit(1));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          console.log(doc.id, " => ", doc.data());
          setData(doc.data());
        });
      } catch (error) {
        console.error("Error fetching document: ", error);
        setData({ error: JSON.stringify(error) });
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">Firebase Test Result</h1>
      <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
        {data ? JSON.stringify(data, null, 2) : "Loading..."}
      </pre>
    </div>
  );
}
