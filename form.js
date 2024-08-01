document.querySelector(".menu-toggle").addEventListener("click", function () {
   document.querySelector(".menu-toggle").classList.toggle("active");
   document.querySelector(".gray-bg-nav-hamburguer").classList.toggle("hidden");
});

let newUserCount = -1;

const clientId = "63cfd92085cf5d2cb507c4b2";
const inputString = "DG1dOnu3/70UYxYV1W8hlabAa33A8lG7WemcBqe@";

const cnpjSelector = document.getElementById("cnpj-selector");
const mainContainer = document.getElementById("main-container");
document.getElementById("newUserBtn").addEventListener("click", createNewUserFields);
document.getElementById("submitBtn").addEventListener("click", handleSubmit);
const form = document.getElementById("form");
const authToken_3681763231 = "P5vmYnW1p3oXlFMFYH4DoetK1cxRBpVmWvYfoAhO";

const authHeaders_237187381937 = new Headers({
   Authorization: "Bearer " + authToken_3681763231,
   "Lw-Client": clientId,
});

const options = {
   method: "GET",
   headers: authHeaders_237187381937,
};

let adminInfo = {};

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
   adminInfo.tags = adminAllInfo.tags;

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

function createNewUserFields() {
   newUserCount++;
   const userInfo = document.createElement("div");
   userInfo.classList.add("userInfo");
   userInfo.id = `userInfo-${newUserCount}`;
   const roleRadios = document.createElement("div");
   roleRadios.classList.add("roleRadios");
   roleRadios.id = `roleRadios-${newUserCount}`;
   const emailDiv = document.createElement("div");
   emailDiv.classList.add("emailDiv");

   const cargoDiv1 = document.createElement("div");
   const cargoDiv2 = document.createElement("div");
   const cargoDiv3 = document.createElement("div");
   cargoDiv1.classList.add("cargoDiv");
   cargoDiv2.classList.add("cargoDiv");
   cargoDiv3.classList.add("cargoDiv");

   const label1 = document.createElement("label");
   label1.htmlFor = `name-${newUserCount}`;
   label1.innerText = "Nome:";
   label1.classList.add("nameLabel");
   const label2 = document.createElement("label");
   label2.htmlFor = `surname-${newUserCount}`;
   label2.innerText = "Sobrenome:";
   const label3 = document.createElement("label");
   label3.htmlFor = `email-${newUserCount}`;
   label3.innerText = "E-mail:";
   const label4 = document.createElement("label");
   label4.innerText = "Cargo:";
   const label5 = document.createElement("label");
   label5.htmlFor = `balconista-${newUserCount}`;
   label5.innerText = "Balconista";
   const label6 = document.createElement("label");
   label6.htmlFor = `farmaceutico-${newUserCount}`;
   label6.innerText = "Farmacêutico(a)";
   const label7 = document.createElement("label");
   label7.htmlFor = `gerente-${newUserCount}`;
   label7.innerText = "Gerente";

   const input1 = document.createElement("input");
   input1.id = `name-${newUserCount}`;
   input1.name = `name-${newUserCount}`;
   input1.required = true;
   input1.type = "text";
   const input2 = document.createElement("input");
   input2.id = `surname-${newUserCount}`;
   input2.name = `surname-${newUserCount}`;
   input2.type = "text";
   const input3 = document.createElement("input");
   input3.id = `email-${newUserCount}`;
   input3.name = `email-${newUserCount}`;
   input3.classList.add("mailInput");
   input3.required = true;
   input3.type = "text";

   const input4 = document.createElement("input");
   input4.id = `balconista-${newUserCount}`;
   input4.name = `cargo-${newUserCount}`;
   input4.type = "radio";
   input4.value = "Cargo - Balconista";
   const input5 = document.createElement("input");
   input5.id = `farmaceutico-${newUserCount}`;
   input5.name = `cargo-${newUserCount}`;
   input5.type = "radio";
   input5.value = "Cargo - Farmacêutico";
   const input6 = document.createElement("input");
   input6.id = `gerente-${newUserCount}`;
   input6.name = `cargo-${newUserCount}`;
   input6.type = "radio";
   input6.value = "Cargo - Gerente";

   cargoDiv1.append(input4, label5);
   cargoDiv2.append(input5, label6);
   cargoDiv3.append(input6, label7);
   roleRadios.append(label4, cargoDiv1, cargoDiv2, cargoDiv3);
   emailDiv.append(label3, input3);
   userInfo.append(label1, input1, label2, input2, emailDiv, roleRadios);
   form.appendChild(userInfo);
}

function handleSubmit() {
   const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   let haveError = false;

   for (let i = 0; i <= newUserCount; i++) {
      const name = document.getElementById(`name-${i}`);
      const surname = document.getElementById(`surname-${i}`);
      const email = document.getElementById(`email-${i}`);
      const role = document.querySelector('input[name="cargo-' + i + '"]:checked');

      if (name.value.length < 2) {
         name.classList.add("error");
         haveError = true;
      } else {
         name.classList.remove("error");
      }
      if (surname.value.length < 2) {
         surname.classList.add("error");
         haveError = true;
      } else {
         surname.classList.remove("error");
      }
      if (!emailPattern.test(email.value)) {
         email.classList.add("error");
         haveError = true;
      } else {
         email.classList.remove("error");
      }
      if (!role) {
         document.getElementById(`roleRadios-${i}`).classList.add("error");
         haveError = true;
      } else {
         document.getElementById(`roleRadios-${i}`).classList.remove("error");
      }
   }

   if (haveError === false) {
      submitUsers();
   } else {
      document.getElementById("error-msg").classList.remove("hidden");
   }
}

async function submitUsers() {
   let usersArr = [];

   let userType;

   for (let tag of adminInfo.tags) {
      if (tag == "Licenciado" || tag == "Saas") {
         userType = tag;
         break;
      }
   }

   for (let i = 0; i <= newUserCount; i++) {
      const name = document.getElementById(`name-${i}`).value;
      const surname = document.getElementById(`surname-${i}`).value;
      const email = document.getElementById(`email-${i}`).value;
      const role = document.querySelector('input[name="cargo-' + i + '"]:checked').value;

      let user = {
         name,
         surname,
         email,
         role,
         cnpj: cnpjSelector.value,
         userType,
      };
      usersArr.push(user);
   }

   const url = "https://hooks.zapier.com/hooks/catch/14607786/3gb7u8c/";

   const sendOptions = {
      method: "POST",
      body: JSON.stringify(usersArr),
   };

   await fetch(url, sendOptions)
      .then((response) => response.json())
      .then((responseData) => {
         console.log(responseData);
         showResults(usersArr);

         usersArr.forEach((user) => {
            const data = {
               date: new Date(),
               createdUserEmail: user.email,
               createdUserRole: user.role,
               createdUserName: `${user.name} ${user.surname}`,
               createdUserTags: ["createdByIntegration", user.cnpj, user.role, "cursos"],
               adminId: adminInfo.adminId,
               adminEmail: adminInfo.email,
               adminName: adminInfo.username,
               type: "Cadastro",
            };
            const options = {
               method: "POST",
               body: JSON.stringify(data),
            };
            fetch("https://hooks.zapier.com/hooks/catch/14607786/3e88wpz/", options);
         });
      })
      .catch((error) => console.error("Error:", error));
}

function showResults(usersArr) {
   mainContainer.innerHTML = `<h2>Usuários Convidados com Sucesso!</h2><h3>Seus colaboradores receberam um e-mail e precisam criar sua senha através dele</h3><div id="created-users-table-div" class="createdUsersTableDiv"></div>`;

   const createdUsersTable = document.createElement("table");
   const tableHead = document.createElement("thead");
   const headRow = document.createElement("tr");

   const headers = ["Nome", "E-mail", "Cargo", "CNPJ", "Status"];

   headers.forEach((headerText) => {
      const headerCell = document.createElement("th");
      headerCell.textContent = headerText;
      headRow.appendChild(headerCell);
   });
   tableHead.appendChild(headRow);

   const tableBody = document.createElement("tbody");

   usersArr.forEach((user) => {
      const userFiltered = {};
      userFiltered.name = user.name + " " + user.surname;
      userFiltered.email = user.email;
      if (user.role == "Cargo - Farmacêutico") {
         userFiltered.role = "Farmacêutico";
      } else if (user.role == "Cargo - Balconista") {
         userFiltered.role = "Balconista";
      } else if (user.role == "Cargo - Gerente") {
         userFiltered.role = "Gerente";
      }
      userFiltered.cnpj = user.cnpj;
      userFiltered.status = "Convite enviado";

      const newRow = document.createElement("tr");

      for (const key in userFiltered) {
         const cell = document.createElement("td");
         cell.textContent = userFiltered[key];
         newRow.appendChild(cell);
      }
      tableBody.appendChild(newRow);
   });

   createdUsersTable.appendChild(tableHead);
   createdUsersTable.appendChild(tableBody);
   document.getElementById("created-users-table-div").appendChild(createdUsersTable);
}

function populateCompanySelector() {
   adminInfo.companyTags.forEach((cnpj) => {
      const option = document.createElement("option");
      option.value = cnpj;
      option.innerText = cnpj;
      cnpjSelector.appendChild(option);
   });

   createNewUserFields();
}

await adminInfoManagement().then(() => {
   populateCompanySelector();
});
