// Se usa la API global de Vue

const { createApp, ref, computed } = Vue;


// Componente: EntradaTarea
//  -Parte para escribir tareas y enviarlas
//  -Se usa el evento 'agregar-tarea' con el texto ya limpiado

const EntradaTarea = {
  template: `
    <div class="input-row">
      <input v-model="texto" @keyup.enter="enviar" placeholder="Añadir nueva tarea..." aria-label="Añadir tarea" />
      <button class="btn" @click="enviar">Agregar</button>
    </div>
  `,
  data() { return { texto: '' } },
  methods: {
    enviar(){
      // Esta parte evitar añadir tareas vacias o solo con espacios
      const valor = this.texto && this.texto.trim();
      if(!valor) return;

      // Emitir el valor al componente padre
      this.$emit('agregar-tarea', valor);
      // Limpia la casilla del input
      this.texto = '';
    }
  }
};

// Componente: ItemTarea
// - Representa una tarea individual
// - Recibe 'tarea' como {id, text, done, createdAt}
// - Genera los eventos 'alternar' (marcar/desmarcar) y 'eliminar'

const ItemTarea = {
  props: ['tarea'],
  template: `
    <div class="todo" :class="{completed: tarea.done}">
      <input type="checkbox" :checked="tarea.done" @change="$emit('alternar', tarea.id)" aria-label="Marcar tarea" />
      <div class="title"><p>{{ tarea.text }}</p><div class="meta">Creada: {{ formatearFecha(tarea.createdAt) }}</div></div>
      <div class="controls">
        <button class="icon-btn" @click="$emit('eliminar', tarea.id)" title="Eliminar">🗑️</button>
      </div>
    </div>
  `,
  methods: {
    formatearFecha(ts){

      // Convierte timestamp (hora actual) en cadena legible según la hora local del navegador
      const d = new Date(ts);
      return d.toLocaleString();
    }
  } 
}; 



// Componente: ListaTareas
// -Recibe 'elementos' como array y renderiza un ItemTarea por cada elemento
// -Re-emite los eventos del hijo hacia el padre para que la app principal los controle

const ListaTareas = {
  props:['elementos'],
  components:{ 'tarea-item': ItemTarea },
  template:`
    <div class="list">
      <div v-if="elementos.length===0" class="sub" style="padding:12px">No hay tareas que mostrar.</div>
      <tarea-item v-for="t in elementos" :key="t.id" :tarea="t" @alternar="$emit('alternar', $event)" @eliminar="$emit('eliminar', $event)"></tarea-item>
    </div>
  `
};


// App principal
// -Estado de tareas (array reactivo) y filtro (string)
// -Persistencia simple de localStorage con la clave CLAVE_ALMACENAMIENTO
// -Funciones: agregarTarea, alternarTarea, eliminarTarea, borrarCompletadas, limpiarTodas

createApp({
  components:{ 'entrada-tarea': EntradaTarea, 'lista-tareas': ListaTareas },
  setup(){
    const CLAVE_ALMACENAMIENTO = 'vue_todo_example_v1';

    // Recupera tareas desde localStorage (o inicia vacío)
    const tareas = ref(JSON.parse(localStorage.getItem(CLAVE_ALMACENAMIENTO) || '[]'));
    const filtro = ref('all');

    // guarda el arreglo actual en localStorage (serializa a JSON)
    const guardar = () => localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(tareas.value));

    // Agrega una nueva tarea (id unico, texto, estado y fecha)
    const agregarTarea = (texto) => {
      tareas.value.unshift({ id: Date.now().toString(36)+Math.random().toString(36).slice(2,6), text:texto, done:false, createdAt: Date.now() });
      guardar();
    };

    // Alterna el estado done de la tarea por id
    const alternarTarea = (id) => {
      const t = tareas.value.find(x=>x.id===id);
      if(t) t.done = !t.done;
      guardar(); 
    }; 

    //Elimina una tarea por id
    const eliminarTarea = (id) => {
      const idx = tareas.value.findIndex(x=>x.id===id);
      if(idx>-1) tareas.value.splice(idx,1);
      guardar(); 
    }; 
    // Elimina todas las tareas completadas 
    const borrarCompletadas = () => {
      tareas.value = tareas.value.filter(t=>!t.done);
      guardar(); 
    }; 

    // Borra todas las tareas (pide confirmación)
    const limpiarTodas = () => {
      if(!confirm('¿Borrar todas las tareas?')) return;
      tareas.value = [];
      guardar();
    };

    // Computed: número de tareas hechas
    const contadorCompletadas = computed(()=> tareas.value.filter(t=>t.done).length);

    // Computed: lista filtrada según 'filtro'

    const tareasFiltradas = computed(()=>{
      if(filtro.value==='active') return tareas.value.filter(t=>!t.done);
      if(filtro.value==='completed') return tareas.value.filter(t=>t.done);
      return tareas.value;
    });

    // Exponer variables y funciones al template
    return { tareas, filtro, agregarTarea, alternarTarea, eliminarTarea, borrarCompletadas, limpiarTodas, contadorCompletadas, tareasFiltradas }; 
  } 
}).mount('#app'); 
