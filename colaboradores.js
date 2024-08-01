document.querySelector(".menu-toggle").addEventListener("click", function () {
   document.querySelector(".menu-toggle").classList.toggle("active");
   document.querySelector(".gray-bg-nav-hamburguer").classList.toggle("hidden");
});

let adminInfo = {};

const authHeaders_237187381937 = new Headers({
   Authorization: "Bearer P5vmYnW1p3oXlFMFYH4DoetK1cxRBpVmWvYfoAhO",
   "Lw-Client": "63cfd92085cf5d2cb507c4b2",
   "Content-Type": "application/json",
   Accept: "application/json",
});

function getDataFromURL() {
   try {
      let queryString = window.location.search.substring(1);
      if (queryString) {
         return queryString;
      } else {
         throw new Error("Erro ao buscar conexão com a farmácia");
      }
   } catch (err) {
      return null;
   }
}

function transformString(input, amount) {
   const result = input
      .split("")
      .map((char) => {
         const charCode = char.charCodeAt(0);
         return String.fromCharCode(charCode + amount);
      })
      .join("");
   return result;
}

async function getAdminInfo(adminId) {
   const options = {
      method: "GET",
      headers: authHeaders_237187381937,
   };

   return await fetch(
      `https://online.universidadedafarmacia.com.br/admin/api/v2/users/${adminId}`,
      options
   ).then((response) => {
      if (!response.ok) {
         throw new Error("Network response was not ok");
      }
      return response.json();
   });
}

async function adminInfoManagement() {
   let dataFromURL = getDataFromURL();

   if (dataFromURL) {
      adminInfo.adminId = transformString(dataFromURL, -2);
      localStorage.setItem("data", JSON.stringify(dataFromURL));
   } else {
      adminInfo.adminId = transformString(localStorage.getItem("data"), -2);
   }
   const adminAllInfo = await getAdminInfo(adminInfo.adminId);

   adminInfo.username = adminAllInfo.username;
   adminInfo.email = adminAllInfo.email;
   adminInfo.companyTags = getCompanyTags();

   function getCompanyTags() {
      let result = [];

      if (adminAllInfo.tags) {
         for (let i = 0; i < adminAllInfo.tags.length; i++) {
            const element = adminAllInfo.tags[i];
            if (typeof element === "string" && /^[\d./-]+$/.test(element)) {
               result.push(element);
            }
         }
         return result.length > 0 ? result : null;
      } else {
         return null;
      }
   }
}

const cnpjSelector = document.getElementById("cnpj-selector");
const tableDiv = document.getElementById("tableDiv");

document.getElementById("refreshBtn").addEventListener("click", () => {
   fetchUsers(cnpjSelector.value);
});

cnpjSelector.addEventListener("change", (event) => {
   tableDiv.innerHTML = "";
   fetchUsers(event.currentTarget.value);
});

function populateCompanySelector() {
   adminInfo.companyTags.forEach((cnpj) => {
      const option = document.createElement("option");
      option.value = cnpj;
      option.innerText = cnpj;
      cnpjSelector.appendChild(option);
   });
}

async function fetchUsers(companyTag) {
   const authHeaders_237187381937 = new Headers({
      Authorization: "Bearer P5vmYnW1p3oXlFMFYH4DoetK1cxRBpVmWvYfoAhO",
      "Lw-Client": "63cfd92085cf5d2cb507c4b2",
   });

   const options = {
      method: "GET",
      headers: authHeaders_237187381937,
   };

   fetch(
      `https://online.universidadedafarmacia.com.br/admin/api/v2/users?tags=${companyTag}`,
      options
   )
      .then((response) => {
         if (!response.ok) {
            throw new Error("Network response was not ok");
         }
         return response.json();
      })
      .then((data) => {
         showUsers(data.data);
      })
      .catch((error) => {
         console.error("Error during fetch:", error);
      });
}

function showUsers(usersArr) {
   tableDiv.innerHTML = "";
   const usersTable = document.createElement("table");
   const tableHead = document.createElement("thead");
   const headRow = document.createElement("tr");

   const headers = ["Nome", "E-mail", "Cargo", "Status", "Desabilitar"];

   headers.forEach((headerText) => {
      const headerCell = document.createElement("th");
      headerCell.textContent = headerText;
      headRow.appendChild(headerCell);
   });
   tableHead.appendChild(headRow);

   const tableBody = document.createElement("tbody");

   usersArr.forEach((user) => {
      const userFiltered = {};
      userFiltered.name = user.username;
      userFiltered.email = user.email;
      userFiltered.role = user.tags.find((item) => item.startsWith("Cargo"));
      user.role = userFiltered.role;

      if (userFiltered.role == "Cargo - Farmacêutico") {
         userFiltered.role = "Farmacêutico(a)";
      } else if (userFiltered.role == "Cargo - Balconista") {
         userFiltered.role = "Balconista";
      } else if (userFiltered.role == "Cargo - Gerente") {
         userFiltered.role = "Gerente";
      } else if (userFiltered.role == "Cargo - Proprietário") {
         userFiltered.role = "Proprietário(a)";
      } else if (userFiltered.role == "Cargo - Administrativo") {
         userFiltered.role = "Administrativo";
      } else if (userFiltered.role == "Cargo - Motoboy") {
         userFiltered.role = "Motoboy";
      }

      userFiltered.status = user.last_login ? "Convite Aceito" : "Convite Enviado";

      const newRow = document.createElement("tr");

      for (const key in userFiltered) {
         if (key === "role" && !userFiltered[key]) {
            const cell = document.createElement("td");
            const enterRoleBtn = document.createElement("button");
            enterRoleBtn.classList.add("primaryBtn", "enterRoleBtn2");
            enterRoleBtn.innerText = "Informar Cargo";
            enterRoleBtn.addEventListener("click", () => {
               handleEnterRoleBtn(user);
            });
            cell.appendChild(enterRoleBtn);
            newRow.appendChild(cell);
         } else {
            const cell = document.createElement("td");
            cell.textContent = userFiltered[key];
            newRow.appendChild(cell);
         }
      }
      const cell = document.createElement("td");
      cell.classList.add("centralizeTrash");
      const disableUserBtn = document.createElement("button");
      const img = document.createElement("img");
      img.src = "./excluir.png";
      disableUserBtn.appendChild(img);

      disableUserBtn.addEventListener("click", () => {
         handleDisableUser(user);
      });
      cell.appendChild(disableUserBtn);
      newRow.appendChild(cell);
      tableBody.appendChild(newRow);
   });

   usersTable.appendChild(tableHead);
   usersTable.appendChild(tableBody);
   tableDiv.appendChild(usersTable);
}

function handleDisableUser(user) {
   let modal = document.getElementById("myModal");
   let span = document.getElementsByClassName("close")[0];
   let yesBtn = document.getElementById("yesBtn");
   let noBtn = document.getElementById("noBtn");
   let textField = document.getElementById("excludedUserNameTextField");
   let dropdown = document.getElementById("dropdown");
   dropdown.value = "";
   document.getElementById("reasonError").classList.add("hidden");
   dropdown.classList.remove("error");

   textField.innerText = user.username;

   modal.style.display = "block";

   span.onclick = function () {
      modal.style.display = "none";
   };

   yesBtn.onclick = function () {
      const reason = dropdown.value;
      if (reason != "") {
         disableUser(user, reason);
         modal.style.display = "none";
      } else {
         document.getElementById("reasonError").classList.remove("hidden");
         dropdown.classList.add("error");
         dropdown.onchange = function () {
            document.getElementById("reasonError").classList.add("hidden");
            dropdown.classList.remove("error");
         };
      }
   };

   noBtn.onclick = function () {
      modal.style.display = "none";
   };

   window.onclick = function (event) {
      if (event.target == modal) {
         modal.style.display = "none";
      }
   };
}

async function disableUser(user, reason) {
   const data = {
      date: new Date(),
      removedUserId: user.id,
      removedUserEmail: user.email,
      removedUserRole: user.role,
      removedUserName: user.username,
      removedUserTags: user.tags,
      adminId: adminInfo.adminId,
      adminEmail: adminInfo.email,
      adminName: adminInfo.username,
      reason,
      type: "Desativação",
   };

   const deleteOptions = {
      method: "PUT",
      headers: authHeaders_237187381937,
   };

   await fetch(
      `https://online.universidadedafarmacia.com.br/admin/api/v2/users/${user.id}/suspend`,
      deleteOptions
   )
      .then(() => {
         fetchUsers(cnpjSelector.value);
         const url = "https://hooks.zapier.com/hooks/catch/14607786/3e4kgck/";
         const options = {
            method: "POST",
            body: JSON.stringify(data),
         };

         fetch(url, options)
            .then((response) => response.json())
            .then((data) => {})
            .catch((error) => console.error("Error:", error));

         const toast = document.getElementById("toast");
         toast.innerText = `Usuário ${user.username} desabilitado com êxito!`;
         toast.style.visibility = "visible";
         setTimeout(function () {
            toast.style.visibility = "hidden";
         }, 3700); // Hide the toast after 5 seconds
      })
      .catch((error) => {
         throw new Error(error);
      });
}

function handleEnterRoleBtn(user) {
   let modal = document.getElementById("roleModal");
   let span = document.getElementsByClassName("close")[1];
   let yesBtn = document.getElementById("role-yesBtn");
   let noBtn = document.getElementById("role-noBtn");
   let textField = document.getElementById("roleUserNameTextField");
   let dropdown = document.getElementById("role-dropdown");
   dropdown.value = "";
   document.getElementById("role-reasonError").classList.add("hidden");
   dropdown.classList.remove("error");

   textField.innerText = user.username;

   modal.style.display = "block";

   span.onclick = function () {
      modal.style.display = "none";
   };

   yesBtn.onclick = function () {
      const role = dropdown.value;
      if (role != "") {
         addUserRole(user, role);
         modal.style.display = "none";
      } else {
         document.getElementById("role-reasonError").classList.remove("hidden");
         dropdown.classList.add("error");
         dropdown.onchange = function () {
            document.getElementById("role-reasonError").classList.add("hidden");
            dropdown.classList.remove("error");
         };
      }
   };

   noBtn.onclick = function () {
      modal.style.display = "none";
   };

   window.onclick = function (event) {
      if (event.target == modal) {
         modal.style.display = "none";
      }
   };
}

async function addUserRole(user, role) {
   const options = {
      method: "PUT",
      headers: authHeaders_237187381937,
      body: JSON.stringify({
         tags: [role],
         action: "attach",
      }),
   };
   console.log(options);
   const url = `https://online.universidadedafarmacia.com.br/admin/api/v2/users/${user.id}/tags`;

   await fetch(url, options)
      .then((response) => response.json())
      .then(() => {
         const toast = document.getElementById("toast");
         toast.innerText = `Atualização de ${role} para ${user.username} realizada com êxito!`;
         toast.style.visibility = "visible";
         setTimeout(function () {
            toast.style.visibility = "hidden";
         }, 3700); // Hide the toast after 5 seconds
         fetchUsers(cnpjSelector.value);
      })
      .catch((err) => console.log(err));
}

await adminInfoManagement().then(() => {
   populateCompanySelector();
   fetchUsers(cnpjSelector.value);
});
