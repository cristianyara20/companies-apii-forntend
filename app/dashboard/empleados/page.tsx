"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Edit2, Trash2, Users, Loader2, AlertCircle, Building2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Empleado {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  cargo: string;
  salario: number;
  compania_id: number;
}

interface Compania {
  id: number;
  nombre: string;
}

export default function EmpleadosPage() {
  const { user } = useAuth();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [companias, setCompanias] = useState<Compania[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Permisos basados en ciudad (misma lógica del backend)
  const isBogota = user?.compania_id === 1;
  const isMedellin = user?.compania_id === 2;
  const canPut = !isMedellin;     // Medellín NO puede PUT
  const canPatch = !isMedellin;   // Medellín NO puede PATCH
  const canDelete = !isBogota;    // Bogotá NO puede DELETE
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const getCompaniaNombre = (id: number) => {
    return companias.find(c => c.id === id)?.nombre || 'Desconocida';
  };

  const filteredEmpleados = empleados.filter(e => {
    const compNombre = getCompaniaNombre(e.compania_id).toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    return (
      e.id.toString().includes(searchLower) ||
      e.nombre.toLowerCase().includes(searchLower) ||
      e.apellido.toLowerCase().includes(searchLower) ||
      compNombre.includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredEmpleados.length / itemsPerPage) || 1;
  const paginatedEmpleados = filteredEmpleados.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: 0, nombre: '', apellido: '', correo: '', cargo: '', salario: 0, compania_id: 0 });
  const [isEditing, setIsEditing] = useState(false);

  // Patch modal state
  const [isPatchModalOpen, setIsPatchModalOpen] = useState(false);
  const [patchData, setPatchData] = useState({ id: 0, cargo: '' });

  // Delete confirm state
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number }>({ open: false, id: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, compRes] = await Promise.all([
        api.get('/empleados?tamano=100&orden=id&dir=desc'),
        api.get('/companias')
      ]);
      setEmpleados(empRes.data.datos || []);
      setCompanias(compRes.data || []);
    } catch (err: any) {
      setError('Error al cargar la información');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (empleado?: Empleado) => {
    if (empleado) {
      setFormData(empleado);
      setIsEditing(true);
    } else {
      setFormData({ id: 0, nombre: '', apellido: '', correo: '', cargo: '', salario: 0, compania_id: user?.compania_id || 0 });
      setIsEditing(false);
    }
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ id: 0, nombre: '', apellido: '', correo: '', cargo: '', salario: 0, compania_id: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Clean data payload, convert to float for salario, int for compania
      const payload = {
        ...formData,
        salario: parseFloat(formData.salario.toString()),
        compania_id: parseInt(formData.compania_id.toString(), 10)
      };

      if (isEditing) {
        // We use PUT for replacing, or PATCH for partial. Let's use PUT as per backend.
        await api.put(`/empleados/${formData.id}`, payload);
      } else {
        await api.post('/empleados', payload);
      }
      fetchData();
      closeModal();
    } catch (err: any) {
      if (err.response?.data?.errores) {
        const errorDetails = err.response.data.errores.map((e: any) => `${e.campo}: ${e.detalle}`).join(', ');
        setError(`Errores de validación: ${errorDetails}`);
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || err.response?.data?.mensaje || 'Error al guardar el empleado');
      }
    }
  };

  const openPatchModal = (empleado: Empleado) => {
    setPatchData({ id: empleado.id, cargo: empleado.cargo });
    setError('');
    setIsPatchModalOpen(true);
  };

  const handlePartialUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/empleados/${patchData.id}`, { cargo: patchData.cargo });
      fetchData();
      setIsPatchModalOpen(false);
    } catch (err: any) {
      if (err.response?.data?.errores) {
        const errorDetails = err.response.data.errores.map((e: any) => `${e.campo}: ${e.detalle}`).join(', ');
        setError(`Errores de validación: ${errorDetails}`);
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || err.response?.data?.mensaje || 'Error en actualización parcial (PATCH).');
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/empleados/${id}`);
      fetchData();
      setDeleteConfirm({ open: false, id: 0 });
    } catch (err: any) {
      setDeleteConfirm({ open: false, id: 0 });
      if (err.response?.data?.errores) {
        const errorDetails = err.response.data.errores.map((e: any) => `${e.campo}: ${e.detalle}`).join(', ');
        setError(`Errores de validación: ${errorDetails}`);
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || err.response?.data?.mensaje || 'Error al eliminar el empleado.');
      }
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Gestión de Empleados</h1>
            <p className="text-sm text-slate-500">Directorio y roles del personal</p>
          </div>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-purple-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Empleado
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por ID, nombre, apellido o compañía..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 sm:text-sm transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Nombre Completo</th>
                <th className="px-6 py-4">Cargo</th>
                <th className="px-6 py-4">Salario</th>
                <th className="px-6 py-4">Compañía</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedEmpleados.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">#{e.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900">{e.nombre} {e.apellido}</span>
                      <span className="text-xs text-slate-500">{e.correo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-medium">
                      {e.cargo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-emerald-600">
                    ${e.salario.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 flex items-center gap-1.5 mt-2">
                    <Building2 className="w-3.5 h-3.5" />
                    {getCompaniaNombre(e.compania_id)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canPatch ? (
                        <button 
                          onClick={() => openPatchModal(e)}
                          className="text-[10px] uppercase font-bold tracking-wider text-purple-600 hover:bg-purple-50 px-2 py-1.5 rounded-lg transition-colors border border-purple-100 mr-1"
                          title="Actualización Parcial (PATCH)"
                        >
                          Patch
                        </button>
                      ) : (
                        <span 
                          className="text-[10px] uppercase font-bold tracking-wider text-slate-300 px-2 py-1.5 rounded-lg border border-slate-100 mr-1 cursor-not-allowed"
                          title="No tienes permiso para PATCH (Medellín)"
                        >
                          Patch
                        </span>
                      )}
                      {canPut ? (
                        <button 
                          onClick={() => openModal(e)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar completo (PUT)"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span
                          className="p-2 text-slate-200 cursor-not-allowed"
                          title="No tienes permiso para editar (Medellín)"
                        >
                          <Edit2 className="w-4 h-4" />
                        </span>
                      )}
                      {canDelete ? (
                        <button 
                          onClick={() => setDeleteConfirm({ open: true, id: e.id })}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span
                          className="p-2 text-slate-200 cursor-not-allowed"
                          title="No tienes permiso para eliminar (Usuario Bogotá)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedEmpleados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">
                    No se encontraron empleados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="text-sm text-slate-500">
              Mostrando página <span className="font-medium text-slate-900">{currentPage}</span> de <span className="font-medium text-slate-900">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              {isEditing ? 'Editar Empleado' : 'Nuevo Empleado'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Apellido</label>
                  <input
                    type="text"
                    value={formData.apellido}
                    onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={formData.correo}
                  onChange={(e) => setFormData({...formData, correo: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                  <input
                    type="text"
                    value={formData.cargo}
                    onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Salario ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.salario}
                    onChange={(e) => setFormData({...formData, salario: Number(e.target.value)})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Compañía (ID)</label>
                <select
                  value={formData.compania_id}
                  onChange={(e) => setFormData({...formData, compania_id: Number(e.target.value)})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all bg-white"
                  required
                >
                  <option value="" disabled>Seleccione una compañía...</option>
                  {companias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre} (ID: {c.id})</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-purple-500/20"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patch Modal */}
      {isPatchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Modificación Parcial (PATCH)</h2>
            <p className="text-sm text-slate-500 mb-6">Solo se actualizará el campo de cargo del empleado.</p>
            <form onSubmit={handlePartialUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nuevo Cargo</label>
                <input
                  type="text"
                  value={patchData.cargo}
                  onChange={(e) => setPatchData({...patchData, cargo: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  required
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPatchModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-purple-500/20"
                >
                  Aplicar PATCH
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar empleado?</h2>
            <p className="text-sm text-slate-500 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirm({ open: false, id: 0 })}
                className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-red-500/20"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
