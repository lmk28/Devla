'use client'

import { LayoutComponent } from "@/components/layout"
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react';

export default function Page() {
  const [featuredCourses, setFeaturedCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      const response = await fetch("http://127.0.0.1:5000/courses");
      const data = await response.json();
      setFeaturedCourses(data);
    };

    fetchCourses();
  }, []);

  return (
    <LayoutComponent>
      <div className="container mx-auto px-4">
        {/* Hero-Abschnitt */}
        <section className="py-20 flex flex-col md:flex-row items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="md:w-1/2 mb-10 md:mb-0"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Lerne <span className="text-blue-500">Programmieren</span> mit <span className="text-pink-500">Devla</span>
            </h1>
            <p className="text-xl mb-8">
              Meistere die Kunst des Programmierens mit unseren von Experten geleiteten Kursen.
            </p>
            <Link href="/courses">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-pink-500 text-white px-8 py-3 rounded-full text-lg font-semibold"
              >
                Kurse erkunden
              </motion.button>
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:w-1/2 mt-4"
          >
            <Image
              src="/devla2.jpeg"
              alt="Programmier-Illustration"
              width={600}
              height={400}
              className="rounded-lg shadow-lg object-cover"
            />
          </motion.div>
        </section>

        {/* Abschnitt für empfohlene Kurse */}
        <section className="py-20">
          <h2 className="text-3xl font-bold mb-10 text-center">Empfohlene Kurse</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredCourses
              .filter(course => [1, 2, 3, 4].includes(course.id)) // Nur Kurse mit ID 1, 2 und 3 anzeigen
              .map((course) => (
                <motion.div
                  key={course.id}
                  whileHover={{ scale: 1.05 }}
                  className="bg-gray-800 rounded-lg overflow-hidden shadow-lg"
                >
                  <Image src={course.image} alt={course.title} width={300} height={200} className="w-full object-cover" />
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                    <p className="text-gray-400">Schwierigkeitsgrad: {course.difficulty}</p>
                  </div>
                </motion.div>
              ))}
          </div>
        </section>
      </div>
    </LayoutComponent>
  )
}