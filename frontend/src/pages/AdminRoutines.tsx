import { useState, useEffect } from 'react';
import routineService from '../services/routineService';
import { getErrorMessage } from '../utils/errorHandler';
import { getMuscleGroupLabel, getDifficultyLabel, getDayLabel, normalizeMuscleGroups, getMuscleGroupsLabel, toggleSetItem, getThumbnailUrl } from '../utils/routineHelpers';
import type { Routine, Exercise, CreateExerciseData, CreateRoutineData, CreateRoutineExerciseData, MuscleGroup, Difficulty } from '../types';
import { MuscleGroup as MuscleGroupEnum, Difficulty as DifficultyEnum } from '../types';
import '../styles/AdminRoutines.css';

const AdminRoutines = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'routines' | 'exercises'>('routines');
  // Set para almacenar los IDs de las rutinas expandidas, permite ver/ocultar ejercicios de cada rutina
  const [expandedRoutines, setExpandedRoutines] = useState<Set<string>>(new Set());
  
  // Estados para modales
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  
  // Estados para formularios
  const [exerciseForm, setExerciseForm] = useState<CreateExerciseData>({
    title: '',
    description: '',
    youtubeVideoId: '',
    muscleGroup: [MuscleGroupEnum.PECHO],
    difficulty: DifficultyEnum.PRINCIPIANTE
  });
  
  const [routineForm, setRoutineForm] = useState<CreateRoutineData>({
    title: '',
    description: '',
    exercises: []
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
  }, []);

  // cargar rutinas y ejercicios desde la API
  // Usa Promise.all para cargar ambos datos en paralelo
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [routinesData, exercisesData] = await Promise.all([
        routineService.getAllRoutines(),
        routineService.getAllExercises()
      ]);
      setRoutines(routinesData);
      setExercises(exercisesData);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(getErrorMessage(err, 'Error al cargar los datos. Por favor, intenta de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  // expandir o colapsar una rutina para ver sus ejercicios
  const toggleExpandRoutine = (routineId: string) => {
    setExpandedRoutines(prev => toggleSetItem(prev, routineId));
  };

  // funciones para manejar modales de ejercicios
  const openCreateExerciseModal = () => {
    setExerciseForm({
      title: '',
      description: '',
      youtubeVideoId: '',
      muscleGroup: [MuscleGroupEnum.PECHO],
      difficulty: DifficultyEnum.PRINCIPIANTE
    });
    setEditingExercise(null);
    setShowExerciseModal(true);
  };

  const openEditExerciseModal = (exercise: Exercise) => {
    setExerciseForm({
      title: exercise.title,
      description: exercise.description,
      youtubeVideoId: exercise.youtubeVideoId,
      // Normalizar grupos musculares para asegurar que siempre sea un array consistente
      muscleGroup: normalizeMuscleGroups(exercise.muscleGroup),
      difficulty: exercise.difficulty
    });
    setEditingExercise(exercise);
    setShowExerciseModal(true);
  };

  const closeExerciseModal = () => {
    setShowExerciseModal(false);
    setEditingExercise(null);
    setExerciseForm({
      title: '',
      description: '',
      youtubeVideoId: '',
      muscleGroup: [MuscleGroupEnum.PECHO],
      difficulty: DifficultyEnum.PRINCIPIANTE
    });
  };

  // Agregar o quitar un grupo muscular del formulario
  const toggleMuscleGroup = (group: MuscleGroup) => {
    setExerciseForm(prev => {
      const groups = prev.muscleGroup.includes(group)
        ? prev.muscleGroup.filter(g => g !== group)
        : [...prev.muscleGroup, group];
      return { ...prev, muscleGroup: groups };
    });
  };

  // Guardar o actualizar un ejercicio
  const handleExerciseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que haya al menos un grupo muscular seleccionado
    if (exerciseForm.muscleGroup.length === 0) {
      setError('Debe seleccionar al menos un grupo muscular');
      return;
    }
    
    try {
      setError('');
      if (editingExercise) {
        await routineService.updateExercise(editingExercise._id, exerciseForm);
      } else {
        await routineService.createExercise(exerciseForm);
      }
      await loadData();
      closeExerciseModal();
    } catch (err) {
      setError(getErrorMessage(err, 'Error al guardar el ejercicio.'));
    }
  };

  // funciones para manejar modales de rutinas
  const openCreateRoutineModal = () => {
    setRoutineForm({
      title: '',
      description: '',
      exercises: []
    });
    setEditingRoutine(null);
    setShowRoutineModal(true);
  };

  // Abrir modal para editar una rutina existente
  const openEditRoutineModal = (routine: Routine) => {
    setRoutineForm({
      title: routine.title,
      description: routine.description,
      // Convertir exerciseId a string si viene como objeto
      // Esto asegura que el formulario siempre trabaje con IDs como strings
      exercises: routine.exercises.map(ex => ({
        exerciseId: typeof ex.exerciseId === 'string' ? ex.exerciseId : ex.exerciseId._id,
        dayOfWeek: ex.dayOfWeek || 'lunes',
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight
      }))
    });
    setEditingRoutine(routine);
    setShowRoutineModal(true);
  };

  const closeRoutineModal = () => {
    setShowRoutineModal(false);
    setEditingRoutine(null);
    setRoutineForm({
      title: '',
      description: '',
      exercises: []
    });
  };

  // Guardar o actualizar una rutina predefinida
  const handleRoutineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      if (editingRoutine) {
        await routineService.updateRoutine(editingRoutine._id, routineForm);
      } else {
        await routineService.createRoutine(routineForm);
      }
      await loadData();
      closeRoutineModal();
    } catch (err) {
      setError(getErrorMessage(err, 'Error al guardar la rutina.'));
    }
  };

  // Añadir un ejercicio a la rutina con valores por defecto
  const addExerciseToRoutine = (exerciseId: string) => {
    setRoutineForm(prev => ({
      ...prev,
      exercises: [...prev.exercises, {
        exerciseId,
        dayOfWeek: 'lunes', // Por defecto se asigna al lunes
        sets: 3, // Valor por defecto de 3 series
        reps: '10', // valor por defecto de 10 repeticiones (string para permitir rangos como "10-12")
        weight: undefined // el peso es opcional, se puede configurar después
      }]
    }));
  };

  // Eliminar un ejercicio de la rutina en edición
  const removeExerciseFromRoutine = (index: number) => {
    setRoutineForm(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  // Actualizar un campo específico de un ejercicio en la rutina
  // Usa map para encontrar el ejercicio por índice y actualizar solo el campo especificado
  const updateRoutineExercise = (index: number, field: keyof CreateRoutineExerciseData, value: string | number | undefined) => {
    setRoutineForm(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => 
        i === index ? { ...ex, [field]: value } : ex
      )
    }));
  };

  // Mostrar estado de carga mientras se obtienen los datos de la API
  if (loading) {
    return (
      <div className="admin-routines-container">
        <div className="admin-routines-loading">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-routines-container">
      <div className="admin-routines-header">
        <h1>Gestión de Rutinas y Ejercicios</h1>
      </div>

      {error && (
        <div className="admin-routines-error">
          <p>{error}</p>
        </div>
      )}

      <div className="admin-routines-tabs">
        <button
          className={`tab-button ${activeTab === 'routines' ? 'active' : ''}`}
          onClick={() => setActiveTab('routines')}
        >
          Rutinas Predefinidas
        </button>
        <button
          className={`tab-button ${activeTab === 'exercises' ? 'active' : ''}`}
          onClick={() => setActiveTab('exercises')}
        >
          Ejercicios
        </button>
      </div>

      {/* Mostrar rutinas o ejercicios según la pestaña activa */}
      {activeTab === 'routines' ? (
        <div className="admin-routines-section">
          <div className="section-header">
            <h2>Rutinas Predefinidas</h2>
            <button className="btn-create" onClick={openCreateRoutineModal}>
              Crear Rutina
            </button>
          </div>

          {routines.length === 0 ? (
            <div className="admin-routines-empty">
              <p>No hay rutinas predefinidas.</p>
            </div>
          ) : (
            <div className="routines-list">
              {routines.map((routine) => {
                const isExpanded = expandedRoutines.has(routine._id);
                
                return (
                  <div key={routine._id} className="routine-card">
                    <div className="routine-header">
                      <div className="routine-title-section">
                        <h3>{routine.title}</h3>
                        <p className="routine-description">{routine.description}</p>
                      </div>
                      <div className="routine-actions">
                        <button
                          className={`routine-expand-btn ${isExpanded ? 'expanded' : ''}`}
                          onClick={() => toggleExpandRoutine(routine._id)}
                        >
                          {isExpanded ? '▲' : '▼'}
                        </button>
                        <button
                          className="btn-edit"
                          onClick={() => openEditRoutineModal(routine)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn-delete"
                          onClick={async () => {
                            if (window.confirm('¿Estás seguro de que quieres eliminar esta rutina?')) {
                              try {
                                await routineService.deleteRoutine(routine._id);
                                await loadData();
                              } catch (err) {
                                setError(getErrorMessage(err, 'Error al eliminar la rutina.'));
                              }
                            }
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="routine-exercises">
                        {routine.exercises.length === 0 ? (
                          <p className="no-exercises">Esta rutina no tiene ejercicios.</p>
                        ) : (
                          routine.exercises.map((routineExercise, index) => {
                            // Si es objeto, lo usamos directamente; si es string, lo buscamos en el array de ejercicios
                            const exercise = typeof routineExercise.exerciseId === 'object' 
                              ? routineExercise.exerciseId 
                              : exercises.find(ex => ex._id === routineExercise.exerciseId);
                            
                            if (!exercise) return null; // Si no se encuentra el ejercicio, no renderizar nada

                            return (
                              <div key={index} className="exercise-mini-card">
                                <img
                                  src={getThumbnailUrl(exercise)}
                                  alt={exercise.title}
                                  className="exercise-thumbnail-mini"
                                />
                                <div className="exercise-mini-info">
                                  <div className="exercise-day-badge">
                                    <span className="day-badge-routine">{getDayLabel(routineExercise.dayOfWeek || 'lunes')}</span>
                                  </div>
                                  <h4>{exercise.title}</h4>
                                  <div className="exercise-mini-details">
                                    <span className="exercise-detail">Series: {routineExercise.sets}</span>
                                    <span className="exercise-detail">Reps: {routineExercise.reps}</span>
                                    {routineExercise.weight && (
                                      <span className="exercise-detail">Peso: {routineExercise.weight}kg</span>
                                    )}
                                  </div>
                                  <span className="exercise-muscle-badge">
                                    {getMuscleGroupsLabel(exercise.muscleGroup)}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="admin-exercises-section">
          <div className="section-header">
            <h2>Ejercicios</h2>
            <button className="btn-create" onClick={openCreateExerciseModal}>
              Crear Ejercicio
            </button>
          </div>

          {exercises.length === 0 ? (
            <div className="admin-routines-empty">
              <p>No hay ejercicios disponibles.</p>
            </div>
          ) : (
            <div className="exercises-grid">
              {exercises.map((exercise) => (
                <div key={exercise._id} className="exercise-card">
                  <img
                    src={getThumbnailUrl(exercise)}
                    alt={exercise.title}
                    className="exercise-thumbnail"
                  />
                  <div className="exercise-card-content">
                    <h3>{exercise.title}</h3>
                    <p className="exercise-description">{exercise.description}</p>
                    <div className="exercise-meta">
                      {/* Mostrar grupos musculares y dificultad como badges */}
                      <div className="muscle-groups-container">
                        {normalizeMuscleGroups(exercise.muscleGroup).map((group, index) => (
                          <span key={index} className="muscle-group-badge">
                            {getMuscleGroupLabel(group)}
                          </span>
                        ))}
                        <span className="difficulty-badge">
                          {getDifficultyLabel(exercise.difficulty)}
                        </span>
                      </div>
                    </div>
                    <div className="exercise-actions">
                      <button
                        className="btn-edit"
                        onClick={() => openEditExerciseModal(exercise)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn-delete"
                        onClick={async () => {
                          if (window.confirm('¿Estás seguro de que quieres eliminar este ejercicio?')) {
                            try {
                              await routineService.deleteExercise(exercise._id);
                              await loadData();
                            } catch (err) {
                              setError(getErrorMessage(err, 'Error al eliminar el ejercicio.'));
                            }
                          }
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Ejercicio */}
      {showExerciseModal && (
        <div className="admin-modal-overlay" onClick={closeExerciseModal}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingExercise ? 'Editar Ejercicio' : 'Crear Ejercicio'}</h2>
              <button className="admin-modal-close" onClick={closeExerciseModal}>×</button>
            </div>
            <form onSubmit={handleExerciseSubmit} className="admin-modal-form">
              <div className="form-group">
                <label htmlFor="exercise-title">Título *</label>
                <input
                  type="text"
                  id="exercise-title"
                  value={exerciseForm.title}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, title: e.target.value })}
                  required
                  maxLength={200}
                />
              </div>

              <div className="form-group">
                <label htmlFor="exercise-description">Descripción *</label>
                <textarea
                  id="exercise-description"
                  value={exerciseForm.description}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, description: e.target.value })}
                  required
                  rows={4}
                  maxLength={1000}
                />
              </div>

              <div className="form-group">
                <label htmlFor="exercise-youtube">ID de Video de YouTube *</label>
                <input
                  type="text"
                  id="exercise-youtube"
                  value={exerciseForm.youtubeVideoId}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, youtubeVideoId: e.target.value })}
                  required
                  placeholder="Ej: dQw4w9WgXcQ"
                />
                <small className="form-hint">Solo el ID del video (no la URL completa)</small>
              </div>

              <div className="form-group">
                <label>Grupos Musculares *</label>
                <div className="muscle-groups-checkbox-list">
                  {Object.values(MuscleGroupEnum).map((group) => (
                    <label key={group} className="muscle-group-checkbox-item">
                      <input
                        type="checkbox"
                        checked={exerciseForm.muscleGroup.includes(group)}
                        onChange={() => toggleMuscleGroup(group)}
                      />
                      <span>{getMuscleGroupLabel(group)}</span>
                    </label>
                  ))}
                </div>
                {exerciseForm.muscleGroup.length === 0 && (
                  <small className="form-error">Debe seleccionar al menos un grupo muscular</small>
                )}
                {exerciseForm.muscleGroup.length > 0 && (
                  <small className="form-hint">
                    {exerciseForm.muscleGroup.length} grupo{exerciseForm.muscleGroup.length !== 1 ? 's' : ''} seleccionado{exerciseForm.muscleGroup.length !== 1 ? 's' : ''}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="exercise-difficulty">Dificultad *</label>
                <select
                  id="exercise-difficulty"
                  value={exerciseForm.difficulty}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, difficulty: e.target.value as Difficulty })}
                  required
                >
                  {Object.values(DifficultyEnum).map((diff) => (
                    <option key={diff} value={diff}>
                      {getDifficultyLabel(diff)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-modal-actions">
                <button type="button" className="btn-cancel" onClick={closeExerciseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-submit">
                  {editingExercise ? 'Guardar Cambios' : 'Crear Ejercicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Rutina */}
      {showRoutineModal && (
        <div className="admin-modal-overlay" onClick={closeRoutineModal}>
          <div className="admin-modal-content admin-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingRoutine ? 'Editar Rutina' : 'Crear Rutina'}</h2>
              <button className="admin-modal-close" onClick={closeRoutineModal}>×</button>
            </div>
            <form onSubmit={handleRoutineSubmit} className="admin-modal-form">
              <div className="form-group">
                <label htmlFor="routine-title">Título *</label>
                <input
                  type="text"
                  id="routine-title"
                  value={routineForm.title}
                  onChange={(e) => setRoutineForm({ ...routineForm, title: e.target.value })}
                  required
                  maxLength={200}
                />
              </div>

              <div className="form-group">
                <label htmlFor="routine-description">Descripción *</label>
                <textarea
                  id="routine-description"
                  value={routineForm.description}
                  onChange={(e) => setRoutineForm({ ...routineForm, description: e.target.value })}
                  required
                  rows={4}
                  maxLength={1000}
                />
              </div>

              <div className="form-group">
                <label>Añadir Ejercicios</label>
                <div className="exercises-selector">
                  {exercises.length === 0 ? (
                    <p className="no-exercises-message">No hay ejercicios disponibles. Crea ejercicios primero.</p>
                  ) : (
                    <div className="exercises-add-list">
                      {exercises.map((exercise) => {
                        // Verificar si el ejercicio ya está añadido a la rutina comparando IDs
                        const isInRoutine = routineForm.exercises.some(ex => ex.exerciseId === exercise._id);
                        return (
                          <div key={exercise._id} className="exercise-add-item">
                            <div className="exercise-add-header">
                              <label className="exercise-checkbox-item">
                                <input
                                  type="checkbox"
                                  checked={isInRoutine}
                                  onChange={() => {
                                    if (isInRoutine) {
                                      const index = routineForm.exercises.findIndex(ex => ex.exerciseId === exercise._id);
                                      removeExerciseFromRoutine(index);
                                    } else {
                                      addExerciseToRoutine(exercise._id);
                                    }
                                  }}
                                />
                                <div className="exercise-checkbox-content">
                                  <img
                                    src={getThumbnailUrl(exercise)}
                                    alt={exercise.title}
                                    className="exercise-checkbox-thumbnail"
                                  />
                                  <div className="exercise-checkbox-info">
                                    <span className="exercise-checkbox-title">{exercise.title}</span>
                                    <span className="exercise-checkbox-meta">
                                      {getMuscleGroupsLabel(exercise.muscleGroup)} • {getDifficultyLabel(exercise.difficulty)}
                                    </span>
                                  </div>
                                </div>
                              </label>
                            </div>
                            {/* Si el ejercicio está en la rutina, mostrar formulario para configurar series, reps, peso y día */}
                            {isInRoutine && (() => {
                              const exerciseIndex = routineForm.exercises.findIndex(ex => ex.exerciseId === exercise._id);
                              const routineExercise = routineForm.exercises[exerciseIndex];
                              return (
                                <div className="exercise-routine-config">
                                  <div className="form-group">
                                    <label>Día de la semana *</label>
                                    <select
                                      value={routineExercise.dayOfWeek}
                                      onChange={(e) => updateRoutineExercise(exerciseIndex, 'dayOfWeek', e.target.value)}
                                      required
                                    >
                                      {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map(day => (
                                        <option key={day} value={day}>{getDayLabel(day)}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="form-row">
                                    <div className="form-group">
                                      <label>Series *</label>
                                      <input
                                        type="number"
                                        min="1"
                                        value={routineExercise.sets}
                                        onChange={(e) => updateRoutineExercise(exerciseIndex, 'sets', parseInt(e.target.value) || 1)}
                                        required
                                      />
                                    </div>
                                    <div className="form-group">
                                      <label>Repeticiones *</label>
                                      <input
                                        type="text"
                                        value={routineExercise.reps}
                                        onChange={(e) => updateRoutineExercise(exerciseIndex, 'reps', e.target.value)}
                                        placeholder="Ej: 10, 10-12, hasta el fallo"
                                        required
                                      />
                                    </div>
                                  </div>
                                  <div className="form-group">
                                    <label>Peso (kg) - Opcional</label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.5"
                                      value={routineExercise.weight || ''}
                                      onChange={(e) => updateRoutineExercise(exerciseIndex, 'weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                                    />
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {routineForm.exercises.length > 0 && (
                  <small className="form-hint">
                    {routineForm.exercises.length} ejercicio{routineForm.exercises.length !== 1 ? 's' : ''} añadido{routineForm.exercises.length !== 1 ? 's' : ''} a la rutina
                  </small>
                )}
              </div>

              <div className="admin-modal-actions">
                <button type="button" className="btn-cancel" onClick={closeRoutineModal}>
                  Cancelar
                </button>
                {/* Deshabilitar el botón si no hay ejercicios añadidos a la rutina */}
                <button type="submit" className="btn-submit" disabled={routineForm.exercises.length === 0}>
                  {editingRoutine ? 'Guardar Cambios' : 'Crear Rutina'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoutines;

