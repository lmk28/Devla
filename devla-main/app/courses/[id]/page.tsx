'use client'

import { LayoutComponent } from "@/components/layout"
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import Image from 'next/image'

export default function CourseDetail() {
  const { id } = useParams()  // Verwende useParams, um die ID aus der URL zu erhalten
  const [courseData, setCourseData] = useState<{ 
    title: string; 
    image: string; 
    description: string; 
    difficulty: string; 
    modules: { id: string; title: string; description: string; content: string; video?: string }[] 
  } | null>(null); // Typ für courseData definiert
  const [activeModule, setActiveModule] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false); // Zustand für das Popup

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:5000/courses/${id}`, {
          method: "GET",
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        });
        if (response.ok) {
          const data = await response.json();
          setCourseData(data);
          console.log(data); // Debugging: Struktur der API-Antwort überprüfen
        } else {
          console.error("Failed to fetch course data:", await response.json());
        }
      } catch (error) {
        console.error("Error fetching course data:", error);
      }
    };

    fetchCourseData();
  }, [id]);

  if (!courseData) {
    return <div>Loading...</div>; // Ladeanzeige, während die Daten abgerufen werden
  }

  const Popup = ({ module, onClose }: { module: { title: string; content: string; description: string; video?: string }; onClose: () => void }) => ( // Typen für Props definiert
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full h-full md:w-11/12 md:h-auto"> {/* Vollbild auf Handys */}
        <div className="flex justify-between items-center mb-4">
          <button onClick={onClose} className="text-white text-xl">&times;</button> {/* X-Symbol zum Schließen */}
        </div>
        {module.video && (
          <CustomVideoPlayer videoSrc={module.video} />
        )}
        <h3 className="text-2xl font-bold">{module.title}</h3> {/* Titel unter dem Video */}
        <p className="text-white opacity-50">{module.content}</p> {/* Modulinhalt grau darstellen */}
      </div>
    </div>
  );

  const CustomVideoPlayer = ({ videoSrc }: { videoSrc: string }) => (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded"
          src={videoSrc.replace("watch?v=", "embed/")}
          title="Video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );

  return (
    <LayoutComponent>
      <div className="container mx-auto px-4 py-20 flex justify-center"> {/* Flexbox hinzugefügt, um den Inhalt zu zentrieren */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-5xl" // Maximale Breite auf 5xl erhöht
        >
          <h1 className="text-4xl font-bold mb-6">{courseData.title}</h1>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-2/3">
              <Image
                src={courseData.image || "/placeholder.svg?height=400&width=600"} // Verwende den Bildpfad oder ein Platzhalterbild
                alt={courseData.title}
                width={600}
                height={400}
                className="rounded-lg shadow-lg mb-6"
              />
              <p className="text-xl mb-4">{courseData.description}</p>
              <p className="text-blue-500 font-semibold mb-8">Schwierigkeit: {courseData.difficulty}</p>
              <h2 className="text-2xl font-bold mb-4">Kursmodule</h2>
              <div className="space-y-4">
                {courseData.modules.map((module) => (
                  <motion.div
                    key={module.id} // Stellen Sie sicher, dass module.id eindeutig ist
                    className="bg-gray-800 p-4 rounded-lg cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      setActiveModule(module);
                      setIsPopupOpen(true); // Popup öffnen
                    }}
                  >
                    <h3 className="text-xl font-semibold">{module.title}</h3>
                    <p className="text-gray-400 opacity-50">{module.description && module.description.trim() !== '' ? module.description.slice(0, 10) + '...' : module.content.slice(0, 10) + '...'}</p> {/* Vorschau der Beschreibung oder Modulinhalt */}
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="md:w-1/3">
              {isPopupOpen && (
                <Popup module={activeModule} onClose={() => setIsPopupOpen(false)} />
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </LayoutComponent>
  )
}