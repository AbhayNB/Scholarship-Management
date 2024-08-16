// Vuex Store
const store = Vuex.createStore({
  state() {
    return {
        logged: !!localStorage.getItem('access_token'),
    };
},
    mutations: {
        setLogged(state, logged) {
            state.logged = logged;
        }
    },
  getters: {
    logged(state) {
        return state.logged;
    },
    isLoggedIn(state) {
        return !!localStorage.getItem('access_token');
      }
  

}
});


// Components 


const Navbar = {
  props: {
    name: {
      type: String,
      required: true
    },
    links: {
      type: Array,
      required: true,
      validator: (value) => {
        return value.every(link =>
          ('name' in link && 'path' in link && 'isRouterLink' in link) || 'action' in link
        );
      }
    }
  },
  computed: {
    filteredLinks() {
      const logged = this.$store.getters.logged;
      return this.links.filter(link => {
        if (link.showWhen === 'both') return true;
        if (link.showWhen === 'loggedIn' && logged) return true;
        if (link.showWhen === 'loggedOut' && !logged) return true;
        return false;
      });
    }
  },
  methods: {
    handleClick(link, event) {
      event.preventDefault(); // Prevent the default action

      if (link.action && typeof link.action === 'function') {
        link.action();
      } else if (link.isRouterLink) {
        this.$router.push(link.path);
      } else {
        window.location.href = link.path;
      }
    },
    handleLogout() {
      // Implement your logout logic here
      this.$store.commit('setLogged', false);
    }
  },
  template: `
    <nav class="navbar navbar-expand-lg bg-body-tertiary">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">{{ name }}</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarText" aria-controls="navbarText" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarText">
          <span class="navbar-text">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
              <li class="nav-item" v-for="(link, index) in filteredLinks" :key="index">
                <a
                  v-if="!link.isRouterLink && !link.action"
                  class="nav-link"
                  :href="link.path"
                  @click="handleClick(link, $event)"
                >
                  {{ link.name }}
                </a>
                <router-link
                  v-if="link.isRouterLink"
                  class="nav-link"
                  :to="link.path"
                >
                  {{ link.name }}
                </router-link>
                <a
                  v-if="link.action"
                  class="nav-link"
                  href="#"
                  @click="handleClick(link, $event)"
                >
                  {{ link.name }}
                </a>
              </li>
            </ul>
          </span>
        </div>
      </div>
    </nav>
  `
};
const msgBox={
  props:['msg'],
  template:`
  <p>{{msg}}</p>
  `
}
// pages

const RegisterPage = {
  data() {
    return {
      username: '',
      password: '',
      role: 'student', // Default role is 'user'
      errorMessage: '',
      successMessage: ''
    };
  },
  methods: {
    async register() {
      try {
        const response = await fetch('http://192.168.102.238:5000/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: this.username,
            password: this.password,
            role: this.role
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'An unexpected error occurred');
        }

        this.successMessage = 'Registration successful! You can now log in.';
        this.username = '';
        this.password = '';
        this.role = 'user';
        this.errorMessage = '';
        this.$router.push('/login');
      } catch (error) {
        this.errorMessage = error.message;
      }
    }
  },
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <h2 class="text-center">Register</h2>
          <form @submit.prevent="register">
            <div class="form-group">
              <label for="username">Username</label>
              <input
                type="text"
                id="username"
                v-model="username"
                class="form-control"
                required
              />
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input
                type="password"
                id="password"
                v-model="password"
                class="form-control"
                required
              />
            </div>
            <div class="form-group">
              <label for="role">Role</label>
              <select id="role" v-model="role" class="form-control">
                <option value="student">Student</option>
                <option value="hod">HOD</option>
              </select>
            </div>
            <br>
            <button type="submit" class="btn btn-primary btn-block">Register</button>
            
            <div v-if="errorMessage" class="alert alert-danger mt-3">
              {{ errorMessage }}
            </div>
            <div v-if="successMessage" class="alert alert-success mt-3">
              {{ successMessage }}
            </div>
          </form>
        </div>
      </div>
    </div>
  `
};


const AuthPage ={
    data(){
        return {
            username: '',
            password: '',
            errorMessage: ''
          };      
    },
    methods: 
    {
        async login() {
          try {
            const response = await fetch('http://192.168.102.238:5000/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                username: this.username,
                password: this.password
              })
            });
    
            if (!response.ok) {
              if (response.status === 401) {
                throw new Error('Invalid username or password');
              } else {
                throw new Error('An unexpected error occurred');
              }
            }
    
            const data = await response.json();
            console.log(data);
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('id', data.id);
            localStorage.setItem('username', data.username);
            localStorage.setItem('role', data.role);

            this.$store.commit('setLogged', true);
            this.$router.push('/'); // Redirect to a dashboard or other page
          } catch (error) {
            this.errorMessage = error.message;
          }
        }
    },
    
    template:`
    <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <h2 class="text-center">Login</h2>
        <form @submit.prevent="login">
          <div class="form-group">
            <label for="username">Username</label>
            <input
              type="text"
              id="username"
              v-model="username"
              class="form-control"
              required
            />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              v-model="password"
              class="form-control"
              required
            />
          </div>
          <br>
          <button type="submit" class="btn btn-primary btn-block">Login</button>
          
          <div v-if="errorMessage" class="alert alert-danger mt-3">
            {{ errorMessage }}
          </div>
        </form>
      </div>
    </div>
  </div>
    `
};

const Home = {
    computed:{
      logged(){
        return this.$store.state.logged
      }
    },
    template: `
      <div>
        <br>
        <h2 v-if="logged">Home Page  </h2>
      </div>
    `
};
  


  // Set up the routes
const routes = [
    { path: '/', component: Home },
    { path: '/login', component: AuthPage },
    { path: '/register', component: RegisterPage }
  ];

const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(), // or createWebHistory() for HTML5 History mode
    routes
  });
  
const app = Vue.createApp({
    data() {
        return {
            appInfo: 'This is my first Vue 3 App, Hi from Abhay :)',
            message: 'Hello, Vue 3 with CDN!',
        };
    },
    components: {
        'msg-box': msgBox, // Register the component
        'navbar':Navbar,
       
    },
    methods: {
        updateMessage() {
            this.message = 'Button clicked!';
            this.books=[]
        },
        logout() {
            localStorage.removeItem('access_token');
            this.$store.commit('setLogged', false);
            this.$router.push('/login');
            alert('Logged out..');
      },

    }

});
app.use(store);
app.use(router);
// app.use(router);
app.mount('#app');