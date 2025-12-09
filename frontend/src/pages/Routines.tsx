import { useState, useEffect, useMemo } from 'react';
import routineService from '../services/routineService';
import { getErrorMessage } from '../utils/errorHandler';
import { getMuscleGroupLabel, getDifficultyLabel, getDayLabel, normalizeMuscleGroups, toggleSetItem } from '../utils/routineHelpers';
import type { Routine, Exercise, UserRoutine } from '../types';
import '../styles/Routines.css';

const Routines = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [myRoutine, setMyRoutine] = useState<UserRoutine | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRoutines, setExpandedRoutines] = useState<Set<string>>(new Set());
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);
  const [showMyRoutine, setShowMyRoutine] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('todos'); // 'todos' o un día específico
  
  // Formulario para añadir/editar ejercicio a mi rutina
  const [exerciseForm, setExerciseForm] = useState({
    dayOfWeek: 'lunes',
    sets: 3,
    reps: '10-12',
    weight: 0,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [routinesData, myRoutineData, exercisesData] = await Promise.all([
        routineService.getAllRoutines(),
        routineService.getMyRoutine().catch(() => null),
        routineService.getAllExercises()
      ]);
      setRoutines(routinesData);
      setMyRoutine(myRoutineData);
      setExercises(exercisesData);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(getErrorMessage(err, 'Error al cargar las rutinas. Por favor, intenta de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandRoutine = (routineId: string) => {
    setExpandedRoutines(prev => toggleSetItem(prev, routineId));
  };

  const handleExerciseClick = (exercise: Exercise, exerciseItem?: UserRoutine['exercises'][0], index?: number) => {
    setSelectedExercise(exercise);
    setEditingExerciseIndex(exerciseItem && index !== undefined ? index : null);
    setExerciseForm(exerciseItem && index !== undefined ? {
      dayOfWeek: exerciseItem.dayOfWeek || 'lunes',
      sets: exerciseItem.sets,
      reps: exerciseItem.reps,
      weight: hasValidWeight(exerciseItem.weight) ? exerciseItem.weight! : 0,
      notes: exerciseItem.notes || ''
    } : {
      dayOfWeek: 'lunes',
      sets: 3,
      reps: '10-12',
      weight: 0,
      notes: ''
    });
  };

  const handleAddToMyRoutine = async () => {
    if (!selectedExercise) return;

    try {
      setError('');
      
      if (editingExerciseIndex !== null && myRoutine) {
        // Modo edición: actualizar ejercicio existente
        await routineService.updateExerciseInMyRoutine(editingExerciseIndex, {
          dayOfWeek: exerciseForm.dayOfWeek,
          sets: exerciseForm.sets,
          reps: exerciseForm.reps,
          weight: hasValidWeight(exerciseForm.weight) ? exerciseForm.weight : undefined,
          notes: exerciseForm.notes
        });
      } else {
        // Modo creación: añadir nuevo ejercicio
        await routineService.addExerciseToMyRoutine({
          exerciseId: selectedExercise._id,
          dayOfWeek: exerciseForm.dayOfWeek,
          sets: exerciseForm.sets,
          reps: exerciseForm.reps,
          weight: hasValidWeight(exerciseForm.weight) ? exerciseForm.weight : undefined,
          notes: exerciseForm.notes
        });
      }
      
      // Recargar mi rutina
      const updatedRoutine = await routineService.getMyRoutine();
      setMyRoutine(updatedRoutine || null);
      
      // Cerrar modal
      setSelectedExercise(null);
      setEditingExerciseIndex(null);
      
    } catch (err) {
      console.error('Error al guardar ejercicio:', err);
      setError(getErrorMessage(err, 'Error al guardar el ejercicio.'));
    }
  };

  const handleMoveExercise = async (fromIndex: number, direction: 'up' | 'down') => {
    if (!myRoutine) return;
    
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    
    if (toIndex < 0 || toIndex >= myRoutine.exercises.length) {
      return; // No se puede mover fuera de los límites
    }

    try {
      setError('');
      const updatedRoutine = await routineService.reorderExercisesInMyRoutine(fromIndex, toIndex);
      setMyRoutine(updatedRoutine);
    } catch (err) {
      console.error('Error al reordenar ejercicio:', err);
      setError(getErrorMessage(err, 'Error al reordenar el ejercicio.'));
    }
  };

  const handleRemoveExercise = async (index: number) => {
    try {
      setError('');
      const updatedRoutine = await routineService.removeExerciseFromMyRoutine(index);
      setMyRoutine(updatedRoutine);
    } catch (err) {
      console.error('Error al eliminar ejercicio:', err);
      setError(getErrorMessage(err, 'Error al eliminar el ejercicio.'));
    }
  };

  // Filtrar ejercicios por día
  const filteredExercises = useMemo(() => {
    if (!myRoutine) return [];
    return selectedDay === 'todos' 
      ? myRoutine.exercises 
      : myRoutine.exercises.filter(ex => ex.dayOfWeek === selectedDay);
  }, [myRoutine, selectedDay]);

  // Helper para obtener URL de thumbnail
  const getThumbnailUrl = (exercise: Exercise) => 
    exercise.thumbnailUrl || `https://img.youtube.com/vi/${exercise.youtubeVideoId}/mqdefault.jpg`;

  // Helper para verificar si tiene peso válido
  const hasValidWeight = (weight?: number | null) => 
    weight !== undefined && weight !== null && weight > 0;

  if (loading) {
    return (
      <div className="routines-container">
        <div className="routines-loading">
          <p>Cargando rutinas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="routines-container">
      <div className="routines-header">
        <h1>Ejercicios y Rutinas</h1>
        <div className="routines-actions">
          <button 
            className="btn-my-routine"
            onClick={() => setShowMyRoutine(!showMyRoutine)}
          >
            {showMyRoutine ? 'Ver Ejercicios' : 'Mi Rutina'}
          </button>
        </div>
      </div>

      {error && (
        <div className="routines-error">
          <p>{error}</p>
        </div>
      )}

      {showMyRoutine ? (
        // Vista de Mi Rutina Personalizada
        <div className="my-routine-section">
          <div className="my-routine-header">
            <h2>{myRoutine?.routineName || 'Mi Rutina'}</h2>
            {myRoutine && myRoutine.exercises.length > 0 && (
              <div className="day-filter">
                <label htmlFor="day-selector">Filtrar por día:</label>
                <select
                  id="day-selector"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="day-selector"
                >
                  <option value="todos">Todos los días</option>
                  {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map(day => (
                    <option key={day} value={day}>{getDayLabel(day)}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {!myRoutine || myRoutine.exercises.length === 0 ? (
            <div className="routines-empty">
              <p>No tienes ejercicios en tu rutina personalizada.</p>
              <p>Selecciona ejercicios de la lista de ejercicios para añadirlos.</p>
            </div>
          ) : (
            <>
              {filteredExercises.length === 0 ? (
                <div className="routines-empty">
                  <p>No tienes ejercicios asignados para {selectedDay === 'todos' ? 'ningún día' : getDayLabel(selectedDay)}.</p>
                </div>
              ) : (
                <div className="my-routine-exercises-grid">
                  {filteredExercises.map((exerciseItem, index) => {
                  // Necesitamos el índice original para las funciones de editar/eliminar/reordenar
                  const originalIndex = myRoutine.exercises.findIndex(
                    (ex) => ex === exerciseItem
                  );
                const exercise = typeof exerciseItem.exerciseId === 'object' 
                  ? exerciseItem.exerciseId 
                  : null;
                
                if (!exercise) return null;

                return (
                  <div key={index} className="my-routine-exercise-card">
                    <div className="exercise-card-thumbnail-wrapper">
                      <img 
                        src={getThumbnailUrl(exercise)}
                        alt={exercise.title}
                        className="exercise-card-thumbnail"
                      />
                      <div className="play-overlay" onClick={() => handleExerciseClick(exercise, exerciseItem, originalIndex)}>
                        <span className="play-icon">▶</span>
                      </div>
                    </div>
                    <div className="exercise-card-content">
                      <h3>{exercise.title}</h3>
                      <div className="exercise-card-day">
                        <span className="day-badge-routine">{getDayLabel(exerciseItem.dayOfWeek)}</span>
                      </div>
                      <div className="exercise-card-meta">
                        <div className="muscle-groups-container">
                          {normalizeMuscleGroups(exercise.muscleGroup).map((group, idx) => (
                            <span key={idx} className="muscle-group-badge-small">
                              {getMuscleGroupLabel(group)}
                            </span>
                          ))}
                        </div>
                        <span className="difficulty-badge-small">
                          {getDifficultyLabel(exercise.difficulty)}
                        </span>
                      </div>
                      <div className="exercise-card-details">
                        <div className="exercise-detail-item">
                          <span className="detail-label">Series:</span>
                          <span className="detail-value">{exerciseItem.sets}</span>
                        </div>
                        <div className="exercise-detail-item">
                          <span className="detail-label">Reps:</span>
                          <span className="detail-value">{exerciseItem.reps}</span>
                        </div>
                        {hasValidWeight(exerciseItem.weight) && (
                          <div className="exercise-detail-item">
                            <span className="detail-label">Peso:</span>
                            <span className="detail-value">{exerciseItem.weight} kg</span>
                          </div>
                        )}
                      </div>
                      {exerciseItem.notes && (
                        <div className="exercise-card-notes">
                          <span className="notes-label">Notas:</span>
                          <span className="notes-text">{exerciseItem.notes}</span>
                        </div>
                      )}
                      <div className="exercise-card-actions">
                        <div className="reorder-buttons">
                          <button
                            className="btn-reorder"
                            onClick={() => handleMoveExercise(originalIndex, 'up')}
                            disabled={originalIndex === 0}
                            title="Mover arriba"
                          >
                            ↑
                          </button>
                          <button
                            className="btn-reorder"
                            onClick={() => handleMoveExercise(originalIndex, 'down')}
                            disabled={originalIndex === myRoutine.exercises.length - 1}
                            title="Mover abajo"
                          >
                            ↓
                          </button>
                        </div>
                        <button
                          className="btn-edit-exercise"
                          onClick={() => handleExerciseClick(exercise, exerciseItem, originalIndex)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn-remove-exercise"
                          onClick={() => handleRemoveExercise(originalIndex)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          {/* Vista de Todos los Ejercicios */}
          <div className="exercises-section">
            <h2>Todos los Ejercicios</h2>
            {exercises.length === 0 ? (
              <div className="routines-empty">
                <p>No hay ejercicios disponibles.</p>
              </div>
            ) : (
              <div className="exercises-grid">
                {exercises.map((exercise) => (
                  <div
                    key={exercise._id}
                    className="exercise-card-clickable"
                    onClick={() => handleExerciseClick(exercise)}
                  >
                    <div className="exercise-thumbnail-wrapper">
                      <img
                        src={getThumbnailUrl(exercise)}
                        alt={exercise.title}
                        className="exercise-thumbnail-card"
                      />
                      <div className="play-overlay">
                        <span className="play-icon">▶</span>
                      </div>
                    </div>
                    <div className="exercise-card-info">
                      <h3>{exercise.title}</h3>
                      <div className="exercise-card-badges">
                        <div className="muscle-groups-container">
                          {normalizeMuscleGroups(exercise.muscleGroup).map((group, idx) => (
                            <span key={idx} className="muscle-group-badge-small">
                              {getMuscleGroupLabel(group)}
                            </span>
                          ))}
                        </div>
                        <span className="difficulty-badge-small">
                          {getDifficultyLabel(exercise.difficulty)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vista de Rutinas Predefinidas */}
          <div className="routines-section">
            <h2>Rutinas Predefinidas</h2>
            {routines.length === 0 ? (
              <div className="routines-empty">
                <p>No hay rutinas disponibles.</p>
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
                        <button
                          className={`routine-expand-btn ${isExpanded ? 'expanded' : ''}`}
                          onClick={() => toggleExpandRoutine(routine._id)}
                        >
                          {isExpanded ? '▲' : '▼'}
                        </button>
                      </div>
                      
                      {isExpanded && (
                        <div className="routine-exercises">
                          {routine.exercises.length === 0 ? (
                            <p className="no-exercises">Esta rutina no tiene ejercicios.</p>
                          ) : (
                            routine.exercises.map((routineExercise, index) => {
                              const exercise = typeof routineExercise.exerciseId === 'object' 
                                ? routineExercise.exerciseId 
                                : exercises.find(ex => ex._id === routineExercise.exerciseId);
                              
                              if (!exercise) return null;

                              return (
                                <div
                                  key={index}
                                  className="exercise-mini-card"
                                  onClick={() => handleExerciseClick(exercise)}
                                >
                                  <div className="exercise-thumbnail-wrapper">
                                    <img
                                      src={getThumbnailUrl(exercise)}
                                      alt={exercise.title}
                                      className="exercise-thumbnail-mini"
                                    />
                                    <div className="play-overlay">
                                      <span className="play-icon">▶</span>
                                    </div>
                                  </div>
                                  <div className="exercise-mini-info">
                                    <div className="exercise-day-badge">
                                      <span className="day-badge-routine">{getDayLabel(routineExercise.dayOfWeek || 'lunes')}</span>
                                    </div>
                                    <h4>{exercise.title}</h4>
                                    <div className="exercise-mini-details">
                                      <span className="exercise-detail">Series: {routineExercise.sets}</span>
                                      <span className="exercise-detail">Reps: {routineExercise.reps}</span>
                                      {hasValidWeight(routineExercise.weight) && (
                                        <span className="exercise-detail">Peso: {routineExercise.weight}kg</span>
                                      )}
                                    </div>
                                    <div className="exercise-mini-badges">
                                      <div className="muscle-groups-container">
                                        {normalizeMuscleGroups(exercise.muscleGroup).map((group, idx) => (
                                          <span key={idx} className="muscle-group-badge-small">
                                            {getMuscleGroupLabel(group)}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
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
        </>
      )}

      {/* Modal de Ejercicio */}
      {selectedExercise && (
        <div className="exercise-modal-overlay" onClick={() => {
          setSelectedExercise(null);
          setEditingExerciseIndex(null);
        }}>
          <div className="exercise-modal" onClick={(e) => e.stopPropagation()}>
            <button className="exercise-modal-close" onClick={() => {
              setSelectedExercise(null);
              setEditingExerciseIndex(null);
            }}>
              ×
            </button>
            
            <div className="exercise-modal-content">
              <div className="exercise-video">
                {/* Permisos del iframe para el video de YouTube */}
                <iframe
                  width="100%"
                  height="400"
                  src={`https://www.youtube.com/embed/${selectedExercise.youtubeVideoId}`}
                  title={selectedExercise.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              
              <div className="exercise-details-modal">
                <h2>{selectedExercise.title}</h2>
                <p className="exercise-description">{selectedExercise.description}</p>
                <div className="exercise-meta-modal">
                  <div className="exercise-meta-item">
                    <span className="exercise-meta-label">Grupo muscular:</span>
                    <div className="muscle-groups-container">
                      {normalizeMuscleGroups(selectedExercise.muscleGroup).map((group, idx) => (
                        <span key={idx} className="muscle-group-badge-modal">
                          {getMuscleGroupLabel(group)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="exercise-meta-item">
                    <span className="exercise-meta-label">Nivel de dificultad:</span>
                    <span className="difficulty-badge-modal">
                      {getDifficultyLabel(selectedExercise.difficulty)}
                    </span>
                  </div>
                </div>
                
                <div className="exercise-form">
                  <h3>{editingExerciseIndex !== null ? 'Editar ejercicio en tu rutina:' : 'Personaliza este ejercicio para tu rutina:'}</h3>
                  <div className="form-group">
                    <label>Día de la semana *</label>
                    <select
                      value={exerciseForm.dayOfWeek}
                      onChange={(e) => setExerciseForm({ ...exerciseForm, dayOfWeek: e.target.value })}
                      required
                    >
                      {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map(day => (
                        <option key={day} value={day}>{getDayLabel(day)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Series:</label>
                    <input
                      type="number"
                      min="1"
                      value={exerciseForm.sets}
                      onChange={(e) => setExerciseForm({ ...exerciseForm, sets: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Repeticiones:</label>
                    <input
                      type="text"
                      value={exerciseForm.reps}
                      onChange={(e) => setExerciseForm({ ...exerciseForm, reps: e.target.value })}
                      placeholder="Ej: 10-12, 15, hasta el fallo"
                    />
                  </div>
                  <div className="form-group">
                    <label>Peso (kg):</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={exerciseForm.weight}
                      onChange={(e) => setExerciseForm({ ...exerciseForm, weight: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Notas (opcional):</label>
                    <textarea
                      value={exerciseForm.notes}
                      onChange={(e) => setExerciseForm({ ...exerciseForm, notes: e.target.value })}
                      placeholder="Añade notas sobre este ejercicio..."
                      rows={3}
                    />
                  </div>
                  <button
                    className="btn-add-to-routine"
                    onClick={handleAddToMyRoutine}
                    disabled={!exerciseForm.dayOfWeek || !exerciseForm.sets || !exerciseForm.reps}
                  >
                    {editingExerciseIndex !== null ? 'Guardar Cambios' : 'Añadir a Mi Rutina'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Routines;

