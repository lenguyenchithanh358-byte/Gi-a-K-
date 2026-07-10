// Standard Frontend Logic for Student CRUD App

document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;

  // Global Alert Helper
  function showAlert(boxId, message, type = 'danger') {
    const alertBox = document.getElementById(boxId);
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.classList.remove('hidden');
    setTimeout(() => {
      alertBox.classList.add('hidden');
    }, 4000);
  }

  // --- AUTH PAGE LOGIC (index.html) ---
  if (currentPath === '/' || currentPath.endsWith('index.html') || currentPath === '') {
    // Check if already logged in
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn) {
          window.location.href = 'dashboard.html';
        }
      });

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    const authTitle = document.getElementById('auth-title');

    // Toggle Forms
    showRegister.addEventListener('click', (e) => {
      e.preventDefault();
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
      authTitle.textContent = 'Đăng Ký';
    });

    showLogin.addEventListener('click', (e) => {
      e.preventDefault();
      registerForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
      authTitle.textContent = 'Đăng Nhập';
    });

    // Submit Login
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;

      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (res.ok) {
          window.location.href = 'dashboard.html';
        } else {
          showAlert('alert-box', data.message || 'Đăng nhập thất bại');
        }
      } catch (err) {
        showAlert('alert-box', 'Lỗi kết nối máy chủ');
      }
    });

    // Submit Register
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullname = document.getElementById('register-fullname').value;
      const username = document.getElementById('register-username').value;
      const password = document.getElementById('register-password').value;

      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, fullname })
        });
        const data = await res.json();

        if (res.ok) {
          showAlert('alert-box', 'Đăng ký thành công! Hãy đăng nhập.', 'success');
          registerForm.reset();
          showLogin.click();
        } else {
          showAlert('alert-box', data.message || 'Đăng ký thất bại');
        }
      } catch (err) {
        showAlert('alert-box', 'Lỗi kết nối máy chủ');
      }
    });
  }

  // --- DASHBOARD LOGIC (dashboard.html) ---
  if (currentPath.endsWith('dashboard.html')) {
    let currentUser = null;

    // Check Authentication
    async function checkAuth() {
      try {
        const res = await fetch('/api/me');
        const data = await res.json();
        if (!data.loggedIn) {
          window.location.href = 'index.html';
        } else {
          currentUser = data.user;
          document.getElementById('user-fullname').textContent = currentUser.fullname;
          loadStudents(); // Load students list once authenticated
        }
      } catch (err) {
        window.location.href = 'index.html';
      }
    }

    checkAuth();

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = 'index.html';
      } catch (err) {
        alert('Lỗi khi đăng xuất');
      }
    });

    // Load Students Function
    async function loadStudents(searchQuery = '') {
      const tbody = document.getElementById('student-list-body');
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">Đang tải dữ liệu...</td></tr>';
      
      try {
        const url = searchQuery ? `/api/students?search=${encodeURIComponent(searchQuery)}` : '/api/students';
        const res = await fetch(url);
        if (res.status === 401) {
          window.location.href = 'index.html';
          return;
        }
        
        const students = await res.json();
        
        if (students.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="text-center">Không tìm thấy sinh viên nào</td></tr>';
          return;
        }

        tbody.innerHTML = '';
        students.forEach(student => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${escapeHTML(student.student_code)}</td>
            <td>${escapeHTML(student.fullname)}</td>
            <td>${escapeHTML(student.email)}</td>
            <td>${escapeHTML(student.major)}</td>
            <td><strong>${student.gpa.toFixed(1)}</strong></td>
            <td>
              <div class="table-actions">
                <button class="btn btn-sm btn-primary edit-btn" data-id="${student.id}">Sửa</button>
                <button class="btn btn-sm btn-danger delete-btn" data-id="${student.id}">Xóa</button>
              </div>
            </td>
          `;
          tbody.appendChild(tr);
        });

        // Attach action handlers
        attachActionListeners();
      } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Lỗi tải dữ liệu sinh viên</td></tr>';
      }
    }

    // HTML escape utility
    function escapeHTML(str) {
      return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
      );
    }

    // Search trigger
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    searchBtn.addEventListener('click', () => {
      loadStudents(searchInput.value.trim());
    });

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        loadStudents(searchInput.value.trim());
      }
    });

    // Modal Control
    const modal = document.getElementById('student-modal');
    const modalTitle = document.getElementById('modal-title');
    const studentForm = document.getElementById('student-form');
    const closeBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-modal-btn');
    const openAddBtn = document.getElementById('open-add-modal-btn');

    function openModal(isEdit = false) {
      modal.classList.remove('hidden');
      if (!isEdit) {
        modalTitle.textContent = 'Thêm Sinh Viên Mới';
        studentForm.reset();
        document.getElementById('student-id').value = '';
        document.getElementById('student-code').disabled = false;
      } else {
        modalTitle.textContent = 'Cập Nhật Thông Tin Sinh Viên';
      }
    }

    function closeModal() {
      modal.classList.add('hidden');
      studentForm.reset();
    }

    openAddBtn.addEventListener('click', () => openModal(false));
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Save Student (Create or Update)
    studentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const id = document.getElementById('student-id').value;
      const student_code = document.getElementById('student-code').value;
      const fullname = document.getElementById('fullname').value;
      const email = document.getElementById('email').value;
      const major = document.getElementById('major').value;
      const gpa = document.getElementById('gpa').value;

      const studentData = { student_code, fullname, email, major, gpa: parseFloat(gpa) || 0 };

      const url = id ? `/api/students/${id}` : '/api/students';
      const method = id ? 'PUT' : 'POST';

      try {
        const res = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(studentData)
        });
        const data = await res.json();

        if (res.ok) {
          showAlert('dashboard-alert', data.message || 'Lưu thành công', 'success');
          closeModal();
          loadStudents(searchInput.value.trim());
        } else {
          alert(data.message || 'Có lỗi xảy ra');
        }
      } catch (err) {
        alert('Lỗi kết nối máy chủ');
      }
    });

    // Action listeners for Edit/Delete
    function attachActionListeners() {
      // Edit
      document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.getAttribute('data-id');
          try {
            const res = await fetch(`/api/students/${id}`);
            if (res.ok) {
              const student = await res.json();
              
              // Fill form
              document.getElementById('student-id').value = student.id;
              document.getElementById('student-code').value = student.student_code;
              document.getElementById('student-code').disabled = true; // Don't let user change student code easily
              document.getElementById('fullname').value = student.fullname;
              document.getElementById('email').value = student.email;
              document.getElementById('major').value = student.major;
              document.getElementById('gpa').value = student.gpa;

              openModal(true);
            } else {
              alert('Không thể tải thông tin sinh viên');
            }
          } catch (err) {
            alert('Lỗi kết nối');
          }
        });
      });

      // Delete
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.getAttribute('data-id');
          if (confirm('Bạn có chắc chắn muốn xóa sinh viên này không?')) {
            try {
              const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
              const data = await res.json();
              if (res.ok) {
                showAlert('dashboard-alert', data.message || 'Đã xóa sinh viên', 'success');
                loadStudents(searchInput.value.trim());
              } else {
                showAlert('dashboard-alert', data.message || 'Xóa thất bại');
              }
            } catch (err) {
              alert('Lỗi kết nối');
            }
          }
        });
      });
    }
  }
});
