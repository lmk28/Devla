"use client";

import { LayoutComponent } from "@/components/layout";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState<string>(""); // Zustand für die Suchanfrage
  const [difficultyFilter, setDifficultyFilter] = useState<string>(""); // Zustand für den Schwierigkeitsgrad-Filter
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login"); // Umleitung zur Login-Seite, wenn nicht eingeloggt
    } else {
      fetchCourses();
    }
  }, [router]);

  const fetchCourses = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/courses", {
        method: "GET",
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      } else {
        const errorData = await response.json();
        console.error("Failed to fetch courses:", errorData);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  // Filtere die Kurse basierend auf der Suchanfrage und dem Schwierigkeitsgrad
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter ? course.difficulty === difficultyFilter : true;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <LayoutComponent>
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold mb-10 text-center">Unsere Kurse</h1>

        {/* Suchleiste */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Suche nach Kursen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700"
          />
        </div>

        {/* Schwierigkeitsgrad-Filter */}
        <div className="mb-4">
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700"
          >
            <option value="">Alle Schwierigkeitsgrade</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <motion.div
              key={course.id}
              whileHover={{ scale: 1.03 }}
              className="bg-gray-800 rounded-lg overflow-hidden shadow-lg"
            >
              <Image
                src={course.image || "/placeholder.svg?height=200&width=300"} // Verwende den Bildpfad oder ein Platzhalterbild
                alt={course.title}
                width={300}
                height={200}
                className="w-full"
              />
              <div className="p-6">
                <h2 className="text-2xl font-semibold mb-2">{course.title}</h2>
                <p className="text-gray-400 mb-4">{course.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-blue-500 font-semibold">
                    Schwierigkeit: {course.difficulty}
                  </span>
                  <Link href={`/courses/${course.id}`}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold"
                    >
                      Mehr erfahren
                    </motion.button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </LayoutComponent>
  );
}
