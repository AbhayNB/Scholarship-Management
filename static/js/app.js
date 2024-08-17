// Vuex Store
const store = Vuex.createStore({
  state() {
    return {
      logged: !!localStorage.getItem('access_token'),
      role: localStorage.getItem('role'),
      username: localStorage.getItem('username'),
      access_token: localStorage.getItem('access_token'),
      uid: localStorage.getItem('id'),
      udid:localStorage.getItem('department_id'),
      udept:localStorage.getItem('department_name'),
      departments: [],
      finances: [],
      applications: [] // State to store applications
    };
  },
  mutations: {
    setLogged(state, logged) {
      state.logged = logged;
    },
    setDepartments(state, departments) {
      state.departments = departments;
    },
    setFinances(state, finances) {
      state.finances = finances;
    },
    setApplications(state, applications) {
      state.applications = applications;
    }
  },
  actions: {
    async fetchDepartments({ commit }) {
      try {
        const response = await fetch('http://127.0.0.1:5000/departments');
        if (!response.ok) {
          throw new Error('Failed to fetch departments');
        }
        const data = await response.json();
        commit('setDepartments', data);
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    },
    async fetchFinances({ commit }) {
      try {
        const response = await fetch('http://127.0.0.1:5000/finances');
        if (!response.ok) {
          throw new Error('Failed to fetch finances');
        }
        const data = await response.json();
        commit('setFinances', data);
      } catch (error) {
        console.error('Error fetching finances:', error);
      }
    },
    async fetchApplications({ commit }) {
      try {
        const response = await fetch('http://127.0.0.1:5000/applications');
        if (!response.ok) {
          throw new Error('Failed to fetch applications');
        }
        const data = await response.json();
        commit('setApplications', data);
      } catch (error) {
        console.error('Error fetching applications:', error);
      }
    },
    // async createApplication({ dispatch }, application) {
    //   try {
    //     const response = await fetch('http://127.0.0.1:5000/applications', {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json'
    //       },
    //       body: JSON.stringify(application)
    //     });
    //     if (!response.ok) {
    //       throw new Error('Failed to create application');
    //     }
    //     await dispatch('fetchApplications');
    //   } catch (error) {
    //     console.error('Error creating application:', error);
    //   }
    // },
    // async updateApplication({ dispatch }, { id, application }) {
    //   try {
    //     const response = await fetch(`http://127.0.0.1:5000/applications/${id}`, {
    //       method: 'PUT',
    //       headers: {
    //         'Content-Type': 'application/json'
    //       },
    //       body: JSON.stringify(application)
    //     });
    //     if (!response.ok) {
    //       throw new Error('Failed to update application');
    //     }
    //     await dispatch('fetchApplications');
    //   } catch (error) {
    //     console.error('Error updating application:', error);
    //   }
    // },
    // async deleteApplication({ dispatch }, id) {
    //   try {
    //     const response = await fetch(`http://127.0.0.1:5000/${id}`, {
    //       method: 'DELETE'
    //     });
    //     if (!response.ok) {
    //       throw new Error('Failed to delete application');
    //     }
    //     await dispatch('fetchApplications');
    //   } catch (error) {
    //     console.error('Error deleting application:', error);
    //   }
    // }
  },
  getters: {
    logged(state) {
      return state.logged;
    },
    isLoggedIn(state) {
      return !!localStorage.getItem('access_token');
    },
    role(state) {
      return state.role;
    },
    username(state){
      return state.username
    },
    departments(state) {
      return state.departments;
    },
    finances(state) {
      return state.finances;
    },
    applications(state) {
      return state.applications;
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
      const role = this.$store.getters.role;
      return this.links.filter(link => {
        if (link.showWhen === 'both') return true;
        if (link.showWhen === 'loggedIn' && logged) return true;
        if (link.showWhen === 'loggedOut' && !logged) return true;
        if (link.showWhen === 'hod' && role==='hod') return true;
        if (link.showWhen === 'principal' && role==='principal') return true;
        if (link.showWhen === 'finance' && role==='finance') return true;
        if (link.showWhen === 'hod' && role==='principal') return true;
        if (link.showWhen === 'finance' && role==='principal') return true;
        if (link.showWhen === 'student' && role==='student') return true;
      
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
// pages
//--- Admin Pages

const HODReview = {
  data() {
    return {
      applications: [], // To hold the applications from the department
      errorMessage: '',
      successMessage: '',
    };
  },
  computed: {
    userRole() {
      return this.$store.state.role; // Get the role from the store
    },
    departmentId() {
      return this.$store.state.udid; // Get the department ID from the store
    }
  },
  async created() {
    if (this.userRole === 'hod') {
      try {
        // Fetch applications for the HOD's department
        const response = await fetch(`http://localhost:5000/applications?department_id=${this.departmentId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch applications');
        }
        this.applications = await response.json();
      } catch (error) {
        this.errorMessage = error.message;
      }
    } else {
      this.errorMessage = 'You do not have the appropriate role to view this page.';
    }
  },
  methods: {
    async updateApplication(application) {
      try {
        console.log('Appn:'+application.recommend)
        const response = await fetch(`http://localhost:5000/applications/${application.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recommend: application.recommend,
            feedback: application.feedback,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update application');
        }

        this.successMessage = 'Application updated successfully!';
      } catch (error) {
        this.errorMessage = error.message;
      }
    }
  },
  template: `
    <div class="container mt-5">
      <div v-if="userRole === 'hod'">
        <h2>Applications for Your Department</h2>
        
        <div v-if="errorMessage" class="alert alert-danger">
          {{ errorMessage }}
        </div>
        
        <div v-if="successMessage" class="alert alert-success">
          {{ successMessage }}
        </div>
        
        <table class="table table-bordered">
          <thead>
            <tr>
              <th>ID</th>
              <th>Student ID</th>
              <th>Status</th>
              <th>Income Certificate</th>
              <th>Marksheet</th>
              <th>SOP</th>
              <th>Recommendation</th>
              <th>Feedback</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="app in applications" :key="app.id">
              <td>{{ app.id }}</td>
              <td>{{ app.student_id }}</td>
              <td>{{ app.status }}</td>
              <td><a :href="app.income_certificate" target="_blank">View</a></td>
              <td><a :href="app.marksheet" target="_blank">View</a></td>
              <td><a :href="app.sop" target="_blank">View</a></td>
              <td>
                <select v-model="app.recommend">
                  <option :value="true">Recommended</option>
                  <option :value="false">Not Recommended</option>
                </select>
              </td>
              <td>
                <textarea v-model="app.feedback" rows="3" class="form-control"></textarea>
              </td>
              <td>
                <button @click="updateApplication(app)" class="btn btn-primary">Update</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else>
        <p>You do not have access to this page.</p>
      </div>
    </div>
  `
};

const AdminHome={
  template:`
  <h1>Wellcome To Admin Page</h1>
  `
}

const AdminAuthPage ={
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
          const response = await fetch('http://127.0.0.1:5000/login', {
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
          localStorage.setItem('role', data.roles);
          localStorage.setItem('department_id', data.department_id);
          localStorage.setItem('department_name', data.department_name);

          this.$store.commit('setLogged', true);
          window.location.href = '/admin_page#/admin_home'; // Redirect to a dashboard or other page
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
//-- other pages
const ScholarshipApplicationForm = {
  computed: {
    studentId() {
      return this.$store.state.uid; // Fetch student ID from the Vuex store
    },
    departmentId() {
      return this.$store.state.udid; // Fetch department ID from the Vuex store
    }
  },
  data() {
    return {
      income_certificate: null,
      marksheet: null,
      sop: null,
      message: ''
    };
  },
  methods: {
    handleFileUpload(event, fieldName) {
      this[fieldName] = event.target.files[0];
    },
    async submitApplication() {
      const formData = new FormData();
      formData.append('student_id', this.studentId); // Use student ID from Vuex store
      formData.append('department_id', this.departmentId); // Use department ID from Vuex store
      if (this.income_certificate) formData.append('income_certificate', this.income_certificate);
      if (this.marksheet) formData.append('marksheet', this.marksheet);
      if (this.sop) formData.append('sop', this.sop);

      try {
        const response = await fetch('http://localhost:5000/api/scholarship/apply', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        this.message = 'Application submitted successfully! Application ID: ' + data.application_id;
        this.clearForm();
      } catch (error) {
        this.message = error.message;
      }
    },
    clearForm() {
      this.income_certificate = null;
      this.marksheet = null;
      this.sop = null;
      if (this.$refs.income_certificate) this.$refs.income_certificate.value = '';
      if (this.$refs.marksheet) this.$refs.marksheet.value = '';
      if (this.$refs.sop) this.$refs.sop.value = '';
    }
  },
  template: `
    <div class="container mt-5">
      <h2>Submit Scholarship Application</h2>
      <form @submit.prevent="submitApplication">
        <div class="mb-3">
          <label for="income_certificate" class="form-label">Income Certificate (PDF):</label>
          <input type="file" @change="handleFileUpload($event, 'income_certificate')" class="form-control" id="income_certificate" accept="application/pdf" ref="income_certificate">
        </div>
        <div class="mb-3">
          <label for="marksheet" class="form-label">Marksheet (PDF):</label>
          <input type="file" @change="handleFileUpload($event, 'marksheet')" class="form-control" id="marksheet" accept="application/pdf" ref="marksheet">
        </div>
        <div class="mb-3">
          <label for="sop" class="form-label">Statement of Purpose (PDF):</label>
          <input type="file" @change="handleFileUpload($event, 'sop')" class="form-control" id="sop" accept="application/pdf" ref="sop">
        </div>
        <button type="submit" class="btn btn-primary">Submit Application</button>
        <p v-if="message" class="mt-3">{{ message }}</p>
      </form>
    </div>
  `
};



const RegisterPage = {

  data() {
    return {
      username: '',
      password: '',
      role: 'student', // Default role
      departmentId: '', // To store selected department ID
      errorMessage: '',
      successMessage: ''
    };
  },
  computed:{
    departments(){
      return this.$store.getters.departments;
    }
  },
  methods: {
    async register() {
      console.log('Role:', this.role); // Add this line for debugging
      try {
        const response = await fetch('http://127.0.0.1:5000/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: this.username,
            password: this.password,
            role: this.role,
            department_id: this.departmentId
          })
        });
  
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'An unexpected error occurred');
        }
  
        this.successMessage = 'Registration successful! You can now log in.';
        this.username = '';
        this.password = '';
        this.role = 'student';
        this.departmentId = '';
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
            <div class="form-group">
              <label for="department">Department</label>
              <select id="department" v-model="departmentId" class="form-control">
                <option value="">Select a department (optional)</option>
                <option v-for="dept in departments" :key="dept.id" :value="dept.id">
                  {{ dept.name }}
                </option>
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
            const response = await fetch('http://127.0.0.1:5000/login', {
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
            localStorage.setItem('role', data.roles);
            localStorage.setItem('department_id', data.department_id);
            localStorage.setItem('department_name', data.department_name);

            this.$store.commit('setLogged', true);
            window.location.href = '/'; // Redirect to a dashboard or other page
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
  computed: {
    logged() {
      return this.$store.getters.logged;
    },
    userDetails() {
      return {
        username: this.$store.getters.username,
        role: this.$store.getters.role
      };
    },
    userApplications() {
      const applications = this.$store.getters.applications || [];
      const userId = this.$store.state.uid;

      // Log for debugging
      console.log('User ID:', userId);
      console.log('Applications:', applications);

      // Filter applications by userId
      return applications.filter(app => Number(app.student_id) === Number(userId));
    },
    hasApplications() {
      // Ensure userApplications is an array
      return Array.isArray(this.userApplications) && this.userApplications.length > 0;
    },
    isAdmin() {
      return this.userDetails.role !== 'student';
    }
  },
  async created() {
    if (this.logged) {
      await this.$store.dispatch('fetchApplications');
    }
  },
  template: `
    <div class="container mt-5">
      <div v-if="logged">
        <!-- Admin Check -->
        <div v-if="isAdmin" class="alert alert-warning">
          <p>Your role is <strong>{{ userDetails.role }}</strong>.</p>
          <div class="card mb-4">
            <div class="card-header">
              <h3>User Details</h3>
            </div>
            <div class="card-body">
              <p><strong>Username:</strong> {{ userDetails.username }}</p>
              <p><strong>Role:</strong> {{ userDetails.role }}</p>
            </div>
          </div>
          <a href='/admin_page#/admin_home' class="btn btn-primary">Go to Admin Page</a>
        </div>

        <!-- Non-Admin View -->
        <div v-else>
          <div class="card mb-4">
            <div class="card-header">
              <h3>User Details</h3>
            </div>
            <div class="card-body">
              <p><strong>Username:</strong> {{ userDetails.username }}</p>
              <p><strong>Role:</strong> {{ userDetails.role }}</p>
            </div>
          </div>

          <!-- Applications Section -->
          <div v-if="hasApplications" class="card mb-4">
            <div class="card-header">
              <h3>Your Applications</h3>
            </div>
            <ul class="list-group list-group-flush">
              <li v-for="app in userApplications" :key="app.id" class="list-group-item">
                <p><strong>Application ID:</strong> {{ app.id }}</p>
                <p><strong>Status:</strong> {{ app.status }}</p>
                <p v-if="app.feedback"><strong>Feedback:</strong> {{ app.feedback }}</p>
                <p v-else>No feedback provided.</p>

                <!-- Documents Section -->
                <div v-if="app.income_certificate">
                  <a :href="app.income_certificate" download class="btn btn-info mt-2">Download Income Certificate</a>
                </div>
                <div v-if="app.marksheet">
                  <a :href="app.marksheet" download class="btn btn-info mt-2">Download Marksheet</a>
                </div>
                <div v-if="app.sop">
                  <a :href="app.sop" download class="btn btn-info mt-2">Download SOP</a>
                </div>
              </li>
            </ul>
          </div>

          <!-- No Applications Section -->
          <div v-if="!hasApplications" class="alert alert-info">
            You do not have any applications. 
            <router-link to="/submitAppn" class="btn btn-primary mt-2">Submit an Application</router-link>
          </div>
        </div>
      </div>
    </div>
  `
};

  
const ApplicationList = {
  name: 'ApplicationList',
  computed: {
    applications() {
      return this.$store.getters.applications;
    }
  },
  methods: {
    async loadApplications() {
      await this.$store.dispatch('fetchApplications');
    }
  },
  created() {
    this.loadApplications();
  },
  template: `
    <div class="container mt-5">
      <h2 class="text-center">Scholarship Applications</h2>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Student ID</th>
            <th>Department ID</th>
            <th>Status</th>
            <th>Application Date</th>
            <th>Income Certificate</th>
            <th>Marksheet</th>
            <th>SOP</th>
            <th>Recommendation</th>
            <th>Feedback</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="app in applications" :key="app.id">
            <td>{{ app.id }}</td>
            <td>{{ app.student_id }}</td>
            <td>{{ app.department_id }}</td>
            <td>{{ app.status }}</td>
            <td>{{ app.application_date }}</td>
            <td>{{ app.income_certificate }}</td>
            <td>{{ app.marksheet }}</td>
            <td>{{ app.sop }}</td>
            <td>{{ app.recommend }}</td>
            <td>{{ app.feedback }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `
};


  // Set up the routes
const routes = [
    { path: '/', component: Home ,  beforeEnter: (to, from, next) => {
      const loggedIn = store.getters.logged; // Access the Vuex store directly
      if (loggedIn) {
        next(); // Proceed to the home page
      } else {
        next('/login'); // Redirect to login page if not logged in
      }
    }},
    { path: '/login', component: AuthPage },
    { path: '/register', component: RegisterPage },
    { path: '/submitAppn', component: ScholarshipApplicationForm },
    { path: '/all_applications', component: ApplicationList },
    { path: '/hodreview', component: HODReview },
    { path: '/admin_home', component: AdminHome },
    { path: '/admin_login', component: AdminAuthPage },

    

    

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
        'navbar':Navbar,
       
    },
    methods: {
        updateMessage() {
            this.message = 'Button clicked!';
            this.books=[]
        },
        logout() {
            localStorage.removeItem('access_token');
            localStorage.removeItem('id');
            localStorage.removeItem('username');
            localStorage.removeItem('role');
            localStorage.removeItem('department_id');
            localStorage.removeItem('department_name');

            this.$store.commit('setLogged', false);
            this.$router.push('/login');
            alert('Logged out..');
      },
      async loadData() {
        await this.$store.dispatch('fetchDepartments');
        await this.$store.dispatch('fetchFinances');
        await this.$store.dispatch('fetchApplications');

        
    }

    },
    mounted() {
      this.loadData();
  }

});
app.use(store);
app.use(router);
// app.use(router);
app.mount('#app');