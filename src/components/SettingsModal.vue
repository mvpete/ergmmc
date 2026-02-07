<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>Settings</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label for="goal">Goal (meters)</label>
          <input
            id="goal"
            type="number"
            v-model.number="localSettings.goal"
            min="1"
            step="1000"
          />
        </div>

        <div class="form-group">
          <label for="startDate">Start Date</label>
          <input
            id="startDate"
            type="date"
            v-model="localSettings.startDate"
          />
        </div>

        <div class="form-group">
          <label for="endDate">End Date</label>
          <input
            id="endDate"
            type="date"
            v-model="localSettings.endDate"
          />
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">Cancel</button>
        <button class="btn btn-danger" @click="resync">Resync</button>
        <button class="btn btn-primary" @click="save">Save</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  settings: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'save', 'resync'])

const localSettings = reactive({
  goal: props.settings.goal,
  startDate: props.settings.startDate,
  endDate: props.settings.endDate
})

watch(() => props.settings, (newSettings) => {
  localSettings.goal = newSettings.goal
  localSettings.startDate = newSettings.startDate
  localSettings.endDate = newSettings.endDate
}, { deep: true })

function save() {
  emit('save', { ...localSettings })
}

function resync() {
  if (confirm('This will clear the cache and re-download all workout data. Continue?')) {
    emit('resync')
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.modal {
  background: #1f2937;
  border-radius: 0.5rem;
  width: 100%;
  max-width: 400px;
  margin: 1rem;
}

@media (max-width: 640px) {
  .modal {
    margin: 0;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #374151;
}

@media (max-width: 640px) {
  .modal-header {
    padding: 0.875rem 1rem;
  }
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: #f9fafb;
}

.modal-body {
  padding: 1.5rem;
}

@media (max-width: 640px) {
  .modal-body {
    padding: 1rem;
  }
}

.form-group {
  margin-bottom: 1.25rem;
}

@media (max-width: 640px) {
  .form-group {
    margin-bottom: 1rem;
  }
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #9ca3af;
  margin-bottom: 0.5rem;
}

.form-group input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  background: #111827;
  border: 1px solid #374151;
  border-radius: 0.375rem;
  color: #f9fafb;
  font-size: 1rem;
  -webkit-appearance: none;
  appearance: none;
}

@media (max-width: 640px) {
  .form-group input {
    font-size: 16px; /* Prevents zoom on iOS */
    padding: 0.75rem;
  }
}

.form-group input:focus {
  outline: none;
  border-color: #10b981;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #374151;
}

@media (max-width: 640px) {
  .modal-footer {
    padding: 0.875rem 1rem;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
}

.btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px; /* Touch-friendly minimum */
}

@media (max-width: 640px) {
  .btn {
    padding: 0.625rem 1.25rem;
  }
}

.btn-secondary {
  background: transparent;
  border: 1px solid #374151;
  color: #9ca3af;
}

.btn-secondary:hover {
  border-color: #4b5563;
  color: #f9fafb;
}

.btn-primary {
  background: #10b981;
  border: none;
  color: #fff;
}

.btn-primary:hover {
  background: #059669;
}

.btn-danger {
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #dc2626;
  color: #dc2626;
}
</style>
