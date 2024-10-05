"use client";

import { LayoutComponent } from "@/components/layout";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Image from "next/image";

interface Module {
  title: string;
  content: string;
  video: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  image: string;
  modules: Module[];
}

const difficultyLevels = ["Beginner", "Intermediate", "Advanced"];

export default function AdminPanel() {
  const [searchQuery, setSearchQuery] = useState<string>(""); // Zustand für die Suchanfrage
  const [courses, setCourses] = useState<Course[]>([]);
  const [newCourse, setNewCourse] = useState<Course>({
    id: 0,
    title: "",
    description: "",
    difficulty: difficultyLevels[0],
    image: "",
    modules: [],
  });

  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [newModule, setNewModule] = useState<Module>({
    title: "",
    content: "",
    video: "",
  });
  const [errorMessage, setErrorMessage] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      try {
        const decodedToken = jwtDecode(token);
        if (!decodedToken.is_admin) {
          router.push("/courses");
        } else {
          fetchCourses();
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        router.push("/login");
      }
    }
  }, [router]);

  const fetchCourses = async () => {
    const response = await fetch("http://127.0.0.1:5000/courses", {
      headers: {
        Authorization: localStorage.getItem("token"),
      },
    });
    if (response.ok) {
      const data = await response.json();
      console.log("Fetched courses:", data); // Debugging
      setCourses(data);
    } else {
      const errorData = await response.json();
      setErrorMessage(errorData.message); // Setzen Sie die Fehlermeldung
      console.error("Failed to fetch courses:", errorData.message);
    }
  };

  const handleAddCourse = async () => {
    const response = await fetch("http://127.0.0.1:5000/add_course", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: localStorage.getItem("token"),
      },
      body: JSON.stringify(newCourse), // Stellen Sie sicher, dass newCourse die Module enthält
    });
    if (response.ok) {
      await fetchCourses();
      setNewCourse({
        id: 0,
        title: "",
        description: "",
        difficulty: difficultyLevels[0],
        image: "",
        modules: [],
      });
    }
  };

  const handleAddModule = async () => {
    if (!editingCourse) return;

    const response = await fetch(
      `http://127.0.0.1:5000/add_module/${editingCourse.id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify(newModule), // Senden Sie das neue Modul
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log(data.message);
      setEditingCourse({
        ...editingCourse,
        modules: [...editingCourse.modules, newModule], // Modul zur Liste hinzufügen
      });
      setNewModule({ title: "", content: "", video: "" }); // Zurücksetzen des neuen Moduls
    } else {
      const errorData = await response.json();
      console.error("Fehler beim Hinzufügen des Moduls:", errorData.message);
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse) return;

    const response = await fetch(
      `http://127.0.0.1:5000/update_course/${editingCourse.id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify(editingCourse), // Senden Sie das gesamte Kursobjekt
      }
    );

    if (response.ok) {
      await fetchCourses();
      setEditingCourse(null);
    } else {
      const errorData = await response.json();
      console.error("Fehler beim Aktualisieren des Kurses:", errorData.message);
    }
  };

  const handleDeleteCourse = async (id: number) => {
    const response = await fetch(`http://127.0.0.1:5000/delete_course/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: localStorage.getItem("token"),
      },
    });
    if (response.ok) {
      await fetchCourses();
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    courseId: number | null
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    // Überprüfen Sie, ob courseId null ist und setzen Sie es auf 'new' oder einen anderen Standardwert
    const idToUse = courseId !== null ? courseId : "new";

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/upload_image/${idToUse}`,
        {
          method: "POST",
          headers: {
            Authorization: localStorage.getItem("token"),
          },
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (courseId) {
          setEditingCourse((prev) =>
            prev ? { ...prev, image: data.image_url } : null
          );
        } else {
          setNewCourse((prev) => ({ ...prev, image: data.image_url }));
        }
      } else {
        const errorData = await response.json();
        console.error("Failed to upload image:", errorData);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  // Filtere die Kurse basierend auf der Suchanfrage
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <LayoutComponent>
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold mb-10 text-center">Admin-Panel</h1>
        {errorMessage && (
          <p className="text-red-500 text-center">{errorMessage}</p>
        )}
        
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

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Neuen Kurs hinzufügen</h2>
          <input
            type="text"
            placeholder="Titel"
            value={newCourse.title}
            onChange={(e) =>
              setNewCourse({ ...newCourse, title: e.target.value })
            }
            className="w-full px-4 py-2 mb-2 rounded-lg bg-gray-800 text-white border border-gray-700"
          />
          <input
            type="text"
            placeholder="Beschreibung"
            value={newCourse.description}
            onChange={(e) =>
              setNewCourse({ ...newCourse, description: e.target.value })
            }
            className="w-full px-4 py-2 mb-2 rounded-lg bg-gray-800 text-white border border-gray-700"
          />
          <select
            value={newCourse.difficulty}
            onChange={(e) =>
              setNewCourse({ ...newCourse, difficulty: e.target.value })
            }
            className="w-full px-4 py-2 mb-2 rounded-lg bg-gray-800 text-white border border-gray-700"
          >
            {difficultyLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>

          {/* Eingabefeld für das Hochladen von Bildern */}
          <h3 className="text-xl font-bold mb-2">Bild hochladen</h3>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              handleImageUpload(e, editingCourse ? editingCourse.id : null)
            }
            className="mb-4"
          />

          {/* UI für Module hinzufügen */}
          <h3 className="text-xl font-bold mb-2">Module hinzufügen</h3>
          <input
            type="text"
            placeholder="Modultitel"
            value={newModule.title}
            onChange={(e) =>
              setNewModule({ ...newModule, title: e.target.value })
            }
            className="w-full px-4 py-2 mb-2 rounded-lg bg-gray-800 text-white border border-gray-700"
          />
          <textarea
            placeholder="Modulinhalt"
            value={newModule.content}
            onChange={(e) =>
              setNewModule({ ...newModule, content: e.target.value })
            }
            className="w-full px-4 py-2 mb-2 rounded-lg bg-gray-800 text-white border border-gray-700"
          />
          <input
            type="text"
            placeholder="Video-URL"
            value={newModule.video}
            onChange={(e) =>
              setNewModule({ ...newModule, video: e.target.value })
            }
            className="w-full px-4 py-2 mb-2 rounded-lg bg-gray-800 text-white border border-gray-700"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddModule}
            className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-2"
          >
            Modul hinzufügen
          </motion.button>

          {/* Anzeigen der hinzugefügten Module */}
          {newCourse.modules.map((module, index) => (
            <div key={index} className="bg-gray-700 p-2 mb-2 rounded">
              <h4 className="font-bold">{module.title}</h4>
              <p>{module.content}</p>
              <p>Video: {module.video}</p>
            </div>
          ))}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddCourse}
            className="bg-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold"
          >
            Kurs hinzufügen
          </motion.button>
        </div>

        {/* Kurse verwalten */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Kurse verwalten</h2>
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-gray-800 p-4 rounded-lg mb-4">
              {editingCourse && editingCourse.id === course.id ? (
                <>
                  {/* Bearbeitungsfelder für den Kurs */}
                  <input
                    type="text"
                    value={editingCourse.title}
                    onChange={(e) =>
                      setEditingCourse({
                        ...editingCourse,
                        title: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 mb-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                  />
                  <input
                    type="text"
                    value={editingCourse.description}
                    onChange={(e) =>
                      setEditingCourse({
                        ...editingCourse,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 mb-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                  />
                  <select
                    value={editingCourse.difficulty}
                    onChange={(e) =>
                      setEditingCourse({
                        ...editingCourse,
                        difficulty: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 mb-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                  >
                    {difficultyLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>

                  {/* Module bearbeiten */}
                  <h3 className="text-xl font-bold mb-2">Module bearbeiten</h3>
                  {editingCourse.modules.map((module, index) => (
                    <div key={index} className="mb-2">
                      <input
                        type="text"
                        value={module.title}
                        onChange={(e) => {
                          const updatedModules = [...editingCourse.modules];
                          updatedModules[index].title = e.target.value;
                          setEditingCourse({
                            ...editingCourse,
                            modules: updatedModules,
                          });
                        }}
                        className="w-full px-4 py-2 mb-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                      />
                      <textarea
                        value={module.content}
                        onChange={(e) => {
                          const updatedModules = [...editingCourse.modules];
                          updatedModules[index].content = e.target.value;
                          setEditingCourse({
                            ...editingCourse,
                            modules: updatedModules,
                          });
                        }}
                        className="w-full px-4 py-2 mb-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                      />
                      <input
                        type="text"
                        value={module.video}
                        onChange={(e) => {
                          const updatedModules = [...editingCourse.modules];
                          updatedModules[index].video = e.target.value;
                          setEditingCourse({
                            ...editingCourse,
                            modules: updatedModules,
                          });
                        }}
                        className="w-full px-4 py-2 mb-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                      />
                      {/* Button zum Entfernen des Moduls */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const updatedModules = editingCourse.modules.filter((_, i) => i !== index);
                          setEditingCourse({
                            ...editingCourse,
                            modules: updatedModules,
                          });
                        }}
                        className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold"
                      >
                        Modul entfernen
                      </motion.button>
                    </div>
                  ))}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleUpdateCourse} // Hier wird die Funktion aufgerufen
                    className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold mr-2"
                  >
                    Speichern
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditingCourse(null)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-full text-sm font-semibold"
                  >
                    Abbrechen
                  </motion.button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold">{course.title}</h3>
                  <p className="text-gray-400">{course.description}</p>
                  <p className="text-blue-500">
                    Schwierigkeit: {course.difficulty}
                  </p>
                  {course.image && (
                    <Image
                      src={course.image}
                      alt="Course image"
                      width={200}
                      height={200}
                      className="mb-2"
                    />
                  )}
                  <h4 className="font-bold mt-2">Module:</h4>
                  {course.modules.map((module, index) => (
                    <div key={index} className="bg-gray-700 p-2 mb-2 rounded">
                      <h5 className="font-bold">{module.title}</h5>
                      <p>{module.content}</p>
                      <p>Video: {module.video}</p> {/* Hier wird die Video-URL angezeigt */}
                    </div>
                  ))}
                  <div className="mt-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEditCourse(course)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold mr-2"
                    >
                      Bearbeiten
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteCourse(course.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold"
                    >
                      Löschen
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </LayoutComponent>
  );
}