// Vuex Store
const store = Vuex.createStore({
  state() {
    return {
      logged: !!localStorage.getItem('access_token'),
      role: localStorage.getItem('role'),
      email: localStorage.getItem('email'),
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
        const response = await fetch('https://scholarship-management-production.up.railway.app/departments');
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
        const response = await fetch('https://scholarship-management-production.up.railway.app/finances');
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
        const response = await fetch('https://scholarship-management-production.up.railway.app/applications');
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
        const response = await fetch(`https://scholarship-management-production.up.railway.app/applications?department_id=${this.departmentId}`);
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

const AdminHome = {
  computed: {
    userDetails() {
      return {
        username: this.$store.state.username,
        role: this.$store.state.role,
        departmentId: this.$store.state.udid,
        departmentName: this.$store.state.udept
      };
    },
    isLoggedIn() {
      return this.$store.getters.isLoggedIn;
    }
  },
  methods: {
    getGreeting() {
      const hour = new Date().getHours();
      if (hour < 12) return "Good morning";
      if (hour < 18) return "Good afternoon";
      return "Good evening";
    }
  },
  template: `
    <div class="container mt-5">
      <h1>Welcome to Admin Page</h1>
      
      <div v-if="isLoggedIn">
        <div class="card mt-4">
          <div class="card-header">
            <h3>{{ getGreeting() }}, {{ userDetails.username }}!</h3>
          </div>
          <div class="card-body">
            <h5 class="card-title">Your Details</h5>
            <ul class="list-group list-group-flush">
              <li class="list-group-item"><strong>Username:</strong> {{ userDetails.username }}</li>
              <li class="list-group-item"><strong>Role:</strong> {{ userDetails.role }}</li>
              <li class="list-group-item" v-if="userDetails.departmentId">
                <strong>Department ID:</strong> {{ userDetails.departmentId }}
              </li>
              <li class="list-group-item" v-if="userDetails.departmentName">
                <strong>Department Name:</strong> {{ userDetails.departmentName }}
              </li>
            </ul>
          </div>
        </div>

        <div class="mt-4">
          <h4>Quick Links For You</h4>
          <div class="list-group">
            <router-link to="/finance" class="list-group-item list-group-item-action" v-if="userDetails.role === 'finance'">
              Finance Management
            </router-link>
            <router-link to="/hodreview" class="list-group-item list-group-item-action" v-if="userDetails.role === 'hod'">
              HOD Review
            </router-link>
            <router-link to="/principalreview" class="list-group-item list-group-item-action" v-if="userDetails.role === 'principal'">
              Principal Review
            </router-link>
          </div>
        </div>
      </div>

      <div v-else class="alert alert-warning mt-4">
        You are not logged in. Please log in to view your details.
      </div>
    </div>
  `
};
const FinanceManagement = {
  data() {
    return {
      finances: [],
      editingFinance: null,
      newFinance: {
        department_id: '',
        budget: ''
      },
      departments: [],
      errorMessage: '',
      successMessage: ''
    };
  },
  computed: {
    isFinanceRole() {
      return this.$store.getters.role === 'finance';
    }
  },
  methods: {
    async fetchFinances() {
      try {
        const response = await fetch('https://scholarship-management-production.up.railway.app/finances');
        if (!response.ok) {
          throw new Error('Failed to fetch finances');
        }
        this.finances = await response.json();
      } catch (error) {
        this.errorMessage = error.message;
      }
    },
    async fetchDepartments() {
      try {
        const response = await fetch('https://scholarship-management-production.up.railway.app/departments');
        if (!response.ok) {
          throw new Error('Failed to fetch departments');
        }
        this.departments = await response.json();
      } catch (error) {
        this.errorMessage = error.message;
      }
    },
    startEditing(finance) {
      this.editingFinance = { ...finance };
    },
    cancelEditing() {
      this.editingFinance = null;
    },
    async saveFinance() {
      try {
        const response = await fetch(`https://scholarship-management-production.up.railway.app/finances/${this.editingFinance.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            budget: this.editingFinance.budget
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update finance');
        }

        this.successMessage = 'Finance updated successfully';
        this.fetchFinances();
        this.editingFinance = null;
      } catch (error) {
        this.errorMessage = error.message;
      }
    },
    async addNewFinance() {
      try {
        const response = await fetch('https://scholarship-management-production.up.railway.app/finances', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.newFinance),
        });

        if (!response.ok) {
          throw new Error('Failed to add new finance');
        }

        this.successMessage = 'New finance added successfully';
        this.fetchFinances();
        this.newFinance = { department_id: '', budget: '' };
      } catch (error) {
        this.errorMessage = error.message;
      }
    },
    async deleteFinance(financeId) {
      if (!confirm('Are you sure you want to delete this finance record?')) {
        return;
      }
      try {
        const response = await fetch(`https://scholarship-management-production.up.railway.app/finances/${financeId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete finance');
        }

        this.successMessage = 'Finance deleted successfully';
        this.fetchFinances();
      } catch (error) {
        this.errorMessage = error.message;
      }
    }
  },
  mounted() {
    if (this.isFinanceRole) {
      this.fetchFinances();
      this.fetchDepartments();
    }
  },
  template: `
    <div class="container mt-5">
      <h2>Finance Management</h2>
      
      <div v-if="!isFinanceRole" class="alert alert-warning">
        You do not have permission to view this page.
      </div>

      <div v-else>
        <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
        <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

        <h3>Current Finances</h3>
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Department</th>
              <th>Budget</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="finance in finances" :key="finance.id">
              <td>{{ finance.id }}</td>
              <td>{{ departments.find(d => d.id === finance.department_id)?.name || 'Unknown' }}</td>
              <td>
                <span v-if="editingFinance?.id !== finance.id">{{ finance.budget }}</span>
                <input v-else v-model.number="editingFinance.budget" type="number" class="form-control">
              </td>
              <td>
                <button v-if="editingFinance?.id !== finance.id" @click="startEditing(finance)" class="btn btn-sm btn-primary">Edit</button>
                <template v-else>
                  <button @click="saveFinance" class="btn btn-sm btn-success">Save</button>
                  <button @click="cancelEditing" class="btn btn-sm btn-secondary">Cancel</button>
                </template>
                <button @click="deleteFinance(finance.id)" class="btn btn-sm btn-danger ml-2">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>

        <h3>Add New Finance</h3>
        <form @submit.prevent="addNewFinance" class="mb-4">
          <div class="form-group">
            <label>Department</label>
            <select v-model="newFinance.department_id" class="form-control" required>
              <option value="">Select Department</option>
              <option v-for="dept in departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Budget</label>
            <input v-model.number="newFinance.budget" type="number" class="form-control" required>
          </div>
          <button type="submit" class="btn btn-primary">Add Finance</button>
        </form>
      </div>
    </div>
  `
};

const PrincipalReview = {
  data() {
    return {
      applications: [],
      finances: [],
      departments: [],
      errorMessage: '',
      successMessage: '',
      scholarshipAmount: 50000 // Scholarship amount per student
    };
  },
  computed: {
    isPrincipal() {
      return this.$store.getters.role === 'principal';
    },
    categorizedApplications() {
      return {
        recommended: this.applications.filter(app => app.recommend === true),
        notRecommended: this.applications.filter(app => app.recommend === false),
        notReviewed: this.applications.filter(app => app.recommend === null)
      };
    }
  },
  methods: {
    async fetchApplications() {
      try {
        const response = await fetch('https://scholarship-management-production.up.railway.app/applications');
        if (!response.ok) {
          throw new Error('Failed to fetch applications');
        }
        this.applications = await response.json();
      } catch (error) {
        this.errorMessage = 'Error fetching applications: ' + error.message;
      }
    },
    async fetchFinances() {
      try {
        const response = await fetch('https://scholarship-management-production.up.railway.app/finances');
        if (!response.ok) {
          throw new Error('Failed to fetch finances');
        }
        this.finances = await response.json();
      } catch (error) {
        this.errorMessage = 'Error fetching finances: ' + error.message;
      }
    },
    async fetchDepartments() {
      try {
        const response = await fetch('https://scholarship-management-production.up.railway.app/departments');
        if (!response.ok) {
          throw new Error('Failed to fetch departments');
        }
        this.departments = await response.json();
      } catch (error) {
        this.errorMessage = 'Error fetching departments: ' + error.message;
      }
    },
    getDepartmentName(departmentId) {
      const department = this.departments.find(d => d.id === departmentId);
      return department ? department.name : 'Unknown';
    },
    getDepartmentBudget(departmentId) {
      const finance = this.finances.find(f => f.department_id === departmentId);
      return finance ? finance.budget : 0;
    },
    async updateApplicationStatus(application, newStatus) {
      const departmentBudget = this.getDepartmentBudget(application.department_id);
      
      if (newStatus === 'accepted' && departmentBudget < this.scholarshipAmount) {
        this.errorMessage = `Cannot accept application. Insufficient budget for ${this.getDepartmentName(application.department_id)}.`;
        return;
      }

      try {
        const response = await fetch(`https://scholarship-management-production.up.railway.app/applications/${application.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update application status');
        }

        if (newStatus === 'accepted') {
          await this.updateDepartmentBudget(application.department_id, departmentBudget - this.scholarshipAmount);
        }

        this.successMessage = `Application ${application.id} ${newStatus}`;
        await this.fetchApplications();
        await this.fetchFinances();
      } catch (error) {
        this.errorMessage = 'Error updating application: ' + error.message;
      }
    },
    async updateDepartmentBudget(departmentId, newBudget) {
      try {
        const response = await fetch(`https://scholarship-management-production.up.railway.app/finances/${departmentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            budget: newBudget
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update department budget');
        }
      } catch (error) {
        this.errorMessage = 'Error updating department budget: ' + error.message;
      }
    }
  },
  mounted() {
    if (this.isPrincipal) {
      this.fetchApplications();
      this.fetchFinances();
      this.fetchDepartments();
    }
  },
  template: `
    <div class="container mt-5">
      <h2>Principal Review</h2>
      
      <div v-if="!isPrincipal" class="alert alert-warning">
        You do not have permission to view this page.
      </div>

      <div v-else>
        <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
        <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

        <h3>Department Budgets</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Available Budget</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="finance in finances" :key="finance.id">
              <td>{{ getDepartmentName(finance.department_id) }}</td>
              <td>{{ finance.budget }}</td>
            </tr>
          </tbody>
        </table>

        <h3>Applications</h3>
        <p>Scholarship amount per student: {{ scholarshipAmount }}</p>

        <div class="accordion" id="applicationsAccordion">
          <div class="accordion-item">
            <h2 class="accordion-header" id="headingRecommended">
              <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseRecommended" aria-expanded="true" aria-controls="collapseRecommended">
                Recommended Applications ({{ categorizedApplications.recommended.length }})
              </button>
            </h2>
            <div id="collapseRecommended" class="accordion-collapse collapse show" aria-labelledby="headingRecommended" data-bs-parent="#applicationsAccordion">
              <div class="accordion-body">
                <table class="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Student ID</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>HOD Feedback</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="app in categorizedApplications.recommended" :key="app.id">
                      <td>{{ app.id }}</td>
                      <td>{{ app.student_id }}</td>
                      <td>{{ getDepartmentName(app.department_id) }}</td>
                      <td>{{ app.status }}</td>
                      <td>{{ app.feedback }}</td>
                      <td>
                        <button 
                          @click="updateApplicationStatus(app, 'accepted')" 
                          class="btn btn-sm btn-success"
                          :disabled="app.status === 'accepted' || getDepartmentBudget(app.department_id) < scholarshipAmount"
                        >
                          Accept
                        </button>
                        <button 
                          @click="updateApplicationStatus(app, 'rejected')" 
                          class="btn btn-sm btn-danger"
                          :disabled="app.status === 'rejected'"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="accordion-item">
            <h2 class="accordion-header" id="headingNotRecommended">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseNotRecommended" aria-expanded="false" aria-controls="collapseNotRecommended">
                Not Recommended Applications ({{ categorizedApplications.notRecommended.length }})
              </button>
            </h2>
            <div id="collapseNotRecommended" class="accordion-collapse collapse" aria-labelledby="headingNotRecommended" data-bs-parent="#applicationsAccordion">
              <div class="accordion-body">
                <table class="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Student ID</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>HOD Feedback</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="app in categorizedApplications.notRecommended" :key="app.id">
                      <td>{{ app.id }}</td>
                      <td>{{ app.student_id }}</td>
                      <td>{{ getDepartmentName(app.department_id) }}</td>
                      <td>{{ app.status }}</td>
                      <td>{{ app.feedback }}</td>
                      <td>
                        <button 
                          @click="updateApplicationStatus(app, 'accepted')" 
                          class="btn btn-sm btn-success"
                          :disabled="app.status === 'accepted' || getDepartmentBudget(app.department_id) < scholarshipAmount"
                        >
                          Accept
                        </button>
                        <button 
                          @click="updateApplicationStatus(app, 'rejected')" 
                          class="btn btn-sm btn-danger"
                          :disabled="app.status === 'rejected'"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="accordion-item">
            <h2 class="accordion-header" id="headingNotReviewed">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseNotReviewed" aria-expanded="false" aria-controls="collapseNotReviewed">
                Not Yet Reviewed Applications ({{ categorizedApplications.notReviewed.length }})
              </button>
            </h2>
            <div id="collapseNotReviewed" class="accordion-collapse collapse" aria-labelledby="headingNotReviewed" data-bs-parent="#applicationsAccordion">
              <div class="accordion-body">
                <table class="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Student ID</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>HOD Feedback</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="app in categorizedApplications.notReviewed" :key="app.id">
                      <td>{{ app.id }}</td>
                      <td>{{ app.student_id }}</td>
                      <td>{{ getDepartmentName(app.department_id) }}</td>
                      <td>{{ app.status }}</td>
                      <td>{{ app.feedback }}</td>
                      <td>
                        <button 
                          @click="updateApplicationStatus(app, 'accepted')" 
                          class="btn btn-sm btn-success"
                          :disabled="app.status === 'accepted' || getDepartmentBudget(app.department_id) < scholarshipAmount"
                        >
                          Accept
                        </button>
                        <button 
                          @click="updateApplicationStatus(app, 'rejected')" 
                          class="btn btn-sm btn-danger"
                          :disabled="app.status === 'rejected'"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
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
          const response = await fetch('https://scholarship-management-production.up.railway.app/login', {
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
const AdminRegisterPage = {

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
        const response = await fetch('https://scholarship-management-production.up.railway.app/register', {
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
                <option value="finance">Finance</option>
                <option value="principal">Principal</option>

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
        const response = await fetch('https://scholarship-management-production.up.railway.app/api/scholarship/apply', {
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
      email:'',
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
        const response = await fetch('https://scholarship-management-production.up.railway.app/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: this.username,
            password: this.password,
            email:this.email,
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
              <div class="mb-3">
    <label for="exampleInputEmail1" class="form-label">Email address</label>
    <input type="email" class="form-control" id="exampleInputEmail1" v-model="email" aria-describedby="emailHelp">
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
            const response = await fetch('https://scholarship-management-production.up.railway.app/login', {
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
            localStorage.setItem('email', data.email);

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
    { path: '/finance', component: FinanceManagement },
    { path: '/principalreview', component: PrincipalReview },
    { path: '/admin_register', component: AdminRegisterPage },

    
    
    

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