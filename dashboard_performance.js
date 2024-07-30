const clientId = "63cfd92085cf5d2cb507c4b2";
const inputString = "P5vmYnW1p3oXlFMFYH4DoetK1cxRBpVmWvYfoAhO";

document.querySelector(".menu-toggle").addEventListener("click", function () {
   document.querySelector(".menu-toggle").classList.toggle("active");
   document.querySelector(".gray-bg-nav-hamburguer").classList.toggle("hidden");
});

const fetchWithRateLimit = async (url, options) => {
   // Ensure that the token bucket is not empty before making a request
   while (tokenBucket.isEmpty()) {
      // Wait for a short duration before checking again
      await delay(100); // Adjust the delay time as needed
   }

   // Consume a token from the token bucket
   tokenBucket.consume();

   // Make the actual fetch request
   return fetch(url, options);
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// TokenBucket class to manage the rate limiting
class TokenBucket {
   constructor(capacity, tokensPerInterval, interval) {
      this.capacity = capacity;
      this.tokens = capacity;
      this.tokensPerInterval = tokensPerInterval;
      this.interval = interval;
      this.lastRefillTime = Date.now();
      this.tokenRefillInterval = setInterval(() => this.refillTokens(), interval);
   }

   refillTokens() {
      const now = Date.now();
      const elapsedTime = now - this.lastRefillTime;
      this.lastRefillTime = now;
      const tokensToAdd = (elapsedTime / 1000) * this.tokensPerInterval;
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
   }

   consume() {
      if (this.tokens >= 1) {
         this.tokens--;
         return true;
      } else {
         return false;
      }
   }

   isEmpty() {
      return this.tokens < 1;
   }
}

// Create a token bucket with the specified rate limit
const tokenBucket = new TokenBucket(20, 20, 11 * 1000); // 30 tokens, 30 tokens per 10 seconds

// Now, you can use fetchWithRateLimit instead of fetch in your code
// Example:
// await fetchWithRateLimit(url, options);

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
   return await fetchWithRateLimit(
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

document.addEventListener("DOMContentLoaded", function () {
   flatpickr(".date-input", {
      dateFormat: "d/m/Y",
      locale: "pt",
      onChange: function (selectedDates, dateStr, instance) {
         // Rearrange the elements
         var parts = dateStr.split("/");
         var rearrangedString = parts[1] + "/" + parts[0] + "/" + parts[2];

         // Convert selected date to Unix timestamp
         const unixTimestamp = Math.round(new Date(rearrangedString).getTime() / 1000);

         // Update value attribute of the input field with the Unix timestamp
         instance.input.dataset.unixtime = unixTimestamp;
      },
   });
});

const authToken_3681763231 = "5b2fZpcER0VklCo8pHTLTwMcyUu51vyoefNkBemZ"

let userProgressDataFromAPI = [];
let userProgressData = [];
let progressRanking = [];
let activeTable = 0;

const orderByProgressBtn = document.querySelector("#orderByProgressBtn");
const orderByTimeBtn = document.querySelector("#orderByTimeBtn");
const orderByScoreBtn = document.querySelector("#orderByScoreBtn");
const reportsContainer = document.querySelector("#reportsContainer");
const headingBox = document.getElementById("headingBox");
const headingBox2 = document.getElementById("headingBox2");
const filterByStatusBtn = document.getElementById("filterByStatusBtn");
const removeFilterBtn = document.getElementById("removeFilterBtn");
const filterBtnGroup = document.getElementById("filterBtnGroup");
const orderBtnGroup = document.getElementById("orderBtnGroup");
const rankingContainer = document.getElementById("ranking-container");
const divider = document.getElementById("divider");
const loadingIndicator = document.getElementById("loadingIndicator");
const filterByDateBtn = document.getElementById("filterByDateBtn");
const removeDateFilterBtn = document.getElementById("removeDateFilterBtn");

orderByProgressBtn.addEventListener("click", orderByProgress);
orderByTimeBtn.addEventListener("click", orderByTime);
orderByScoreBtn.addEventListener("click", orderByScore);
filterByStatusBtn.addEventListener("click", () => {
   let selectedOption = document.getElementById("options").value;
   filterByStatus(selectedOption);
});
removeFilterBtn.addEventListener("click", () => {
   removeFilter();
});
filterByDateBtn.addEventListener("click", () => {
   filterByDateBtn.classList.add("selectedBtn");
   filterByDateBtn.innerText = "Filtrado";
   filterByDate();
});
removeDateFilterBtn.addEventListener("click", () => {
   removeDateFilter();
   filterByDateBtn.innerText = "Filtrar";
});

const authHeaders_237187381937 = new Headers({
   Authorization: "Bearer " + authToken_3681763231,
   "Lw-Client": clientId,
});

const options = {
   method: "GET",
   headers: authHeaders_237187381937,
};

async function generateDashboard() {
   document.getElementById("adminName").innerText = adminInfo.username;
   if (adminInfo.companyTags.length === 1) {
      fetchUsers(adminInfo.companyTags[0]);
   } else if (adminInfo.companyTags.length > 1) {
      const companyTagsText = adminInfo.companyTags.reduce((text, tag, index) => {
         const currentText = `${index + 1} - ${tag} \n`;
         return text + currentText;
      }, "");

      const selectedTag = Number(
         window.prompt(
            `Encontramos mais de um CNPJ associado a sua conta: \n\n${companyTagsText} \n Qual deles você deseja visualizar? \n Digite um número de 1 a ${adminInfo.companyTags.length}.`
         )
      );

      if (
         typeof selectedTag == "number" &&
         selectedTag <= adminInfo.companyTags.length &&
         selectedTag > 0
      ) {
         fetchUsers(adminInfo.companyTags[selectedTag - 1]);
      } else {
         window.alert("Resposta Inválida");
      }
   } else if (adminInfo.companyTags === null) {
      throw new Error("No company tags were found for this user!");
   }
}

async function fetchUsers(companyTag) {
   fetchWithRateLimit(
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
         console.log(data);
         fetchUserReports(data).then((data) => {
            return data;
         });
      })
      .catch((error) => {
         console.error("Error during fetch:", error);
         loadingText.innerText =
            "Erro ao carregar o relatório. Pedimos desculpas pelo transtorno, entre em contato com nosso suporte!";
      });
}

async function fetchUserReports(data) {
   const users = data.data;
   await users.map(async (user) => {
      await fetchWithRateLimit(
         `https://online.universidadedafarmacia.com.br/admin/api/v2/users/${user.id}/progress?items_per_page=200`,
         options
      )
         .then((response) => {
            if (!response.ok) {
               console.log("Usuário não tem dados de progresso em nenhum curso");
            } else {
               return response.json();
            }
         })
         .then(async (data) => {
            console.log(data);
            let completedCoursesInfo = [];

            const time = data.data.reduce((accumTime, course) => {
               return accumTime + course.time_on_course;
            }, 0);

            const fetchDataForPage = async (page) => {
               const url = `https://online.universidadedafarmacia.com.br/admin/api/v2/event-logs?user_id=${user.id}&page=${page}`;
               const response = await fetchWithRateLimit(url, options);
               if (!response.ok) {
                  throw new Error(`Error fetching data for page ${page}`);
               }
               const data = await response.json();
               return data.data.filter((item) => item.activity === "complete_course");
            };

            const initialResponse = await fetchWithRateLimit(
               `https://online.universidadedafarmacia.com.br/admin/api/v2/event-logs?user_id=${user.id}`,
               options
            );
            if (!initialResponse.ok) {
               throw new Error("Error fetching initial data");
            }
            const initialData = await initialResponse.json();
            let totalPages = initialData.meta.totalPages;

            for (let page = 1; page <= totalPages; page++) {
               try {
                  const pageData = await fetchDataForPage(page);
                  completedCoursesInfo = completedCoursesInfo.concat(pageData);
               } catch (error) {
                  console.error(error);
               }
            }

            completedCoursesInfo = completedCoursesInfo.filter((activity, index, self) => {
               return (
                  self.findIndex(
                     (item) => item.additional_info.titleId === activity.additional_info.titleId
                  ) === index
               );
            });

            const completedCoursesCount = completedCoursesInfo.length;

            const userData = {
               name: user.username,
               data: data.data,
               completed_courses: completedCoursesCount,
               time: time,
               completed_courses_info: completedCoursesInfo,
            };

            userProgressDataFromAPI.push(userData);

            progressRanking = JSON.parse(JSON.stringify(userProgressDataFromAPI));
            progressRanking.sort((a, b) => b.completed_courses - a.completed_courses);
            progressRanking.forEach((user) => delete user.data);

            userProgressData = JSON.parse(JSON.stringify(userProgressDataFromAPI));
            showRanking();
            showReports();
            showHiddenElements();
         })
         .catch((error) => {
            console.error("Error during fetch:", error);
         });
   });
}

function orderRanking(orderBy) {
   if (orderBy == "completed") {
      progressRanking.sort((a, b) => b.completed_courses - a.completed_courses);
   } else if (orderBy == "time") {
      progressRanking.sort((a, b) => b.time - a.time);
   }

   showRanking(false);
}

function showRanking(formatTime = true) {
   rankingContainer.innerHTML = "";
   const rankingTable = document.createElement("table");

   const tableHead = document.createElement("thead");
   const headRow = document.createElement("tr");

   const headers = ["Nome do Aluno", "Cursos Finalizados", "Tempo de Estudo"];

   headers.forEach((headerText) => {
      const headerCell = document.createElement("th");
      const headerTextBox = document.createElement("p");
      headerTextBox.textContent = headerText;

      if (headerText == "Cursos Finalizados") {
         headerCell.addEventListener("click", () => orderRanking("completed"));
         headerTextBox.appendChild(createOrderIcon());
         headerCell.classList.add("clickable");
      }
      if (headerText == "Tempo de Estudo") {
         headerCell.addEventListener("click", () => orderRanking("time"));
         headerTextBox.appendChild(createOrderIcon());
         headerCell.classList.add("clickable");
      }
      headerCell.appendChild(headerTextBox);
      headRow.appendChild(headerCell);
   });

   tableHead.appendChild(headRow);
   rankingTable.appendChild(tableHead);

   const tableBody = document.createElement("tbody");

   progressRanking.forEach((user) => {
      const userRow = document.createElement("tr");
      userRow.dataset.username = user.name;
      userRow.classList.add("userRow");
      userRow.addEventListener("click", () => showUserTable(user.name));

      if (formatTime == true) {
         let seconds = user.time;
         let hours = Math.floor(seconds / 3600);
         let minutes = Math.floor((seconds % 3600) / 60);
         let remainingSeconds = seconds % 60;

         let formattedTime = "";

         if (hours > 0) {
            formattedTime += `${hours}:`;
         }

         if (minutes < 10) {
            formattedTime += `0${minutes}:`;
         } else {
            formattedTime += `${minutes}:`;
         }

         if (remainingSeconds < 10) {
            formattedTime += `0${remainingSeconds}`;
         } else {
            formattedTime += `${remainingSeconds}`;
         }

         user.formattedTime = formattedTime;
      }

      for (const key in user) {
         if (key != "time" && key != "completed_courses_info") {
            const cell = document.createElement("td");
            cell.textContent = user[key];

            userRow.appendChild(cell);
         }
      }
      tableBody.appendChild(userRow);
   });

   rankingTable.appendChild(tableBody);
   rankingContainer.appendChild(rankingTable);
}

function showReports() {
   const userSelect = document.querySelector(".userSelect");
   userSelect.addEventListener("change", () => showUserTable(userSelect.value));
   userSelect.innerHTML = "";

   const tablesContainer = document.querySelector(".user-tables");
   tablesContainer.innerHTML = "";

   userProgressData.forEach((user, index) => {
      const userOption = document.createElement("option");
      userOption.textContent = user.name;
      userOption.dataset.username = user.name;
      userOption.dataset.TabIndex = index;
      userOption.value = user.name;

      userSelect.appendChild(userOption);

      const userBiggerDiv = document.createElement("div");
      const userTitleDiv = document.createElement("div");
      userBiggerDiv.classList.add("userBiggerDiv", "hidden");
      userTitleDiv.classList.add("userTitleDiv");
      const userDiv = document.createElement("div");
      userDiv.classList.add("userDiv");
      const tableName = document.createElement("h1");
      tableName.innerText = user.name;
      const completedCoursesCountText = document.createElement("h3");
      completedCoursesCountText.innerText = `Cursos finalizados: ${user.completed_courses}`;

      const userTable = document.createElement("table");
      userTable.className = "user-table";
      userBiggerDiv.dataset.username = user.name;

      const tableHead = document.createElement("thead");
      const headRow = document.createElement("tr");

      const headers = ["Curso", "Status", "Progresso", "Nota", "Tempo no Curso"];

      headers.forEach((headerText) => {
         const headerCell = document.createElement("th");

         headerCell.textContent = headerText;
         if (headerText == "Progresso") {
            headerCell.addEventListener("click", () => orderByProgress());

            headerCell.classList.add("clickable");
         }
         if (headerText == "Tempo no Curso") {
            headerCell.addEventListener("click", () => orderByTime());

            headerCell.classList.add("clickable");
         }
         if (headerText == "Nota") {
            headerCell.addEventListener("click", () => orderByScore());

            headerCell.classList.add("clickable");
         }

         headRow.appendChild(headerCell);
      });

      tableHead.appendChild(headRow);
      userTable.appendChild(tableHead);

      const tableBody = document.createElement("tbody");

      user.data.forEach((course) => {
         const courseWithoutProgress = { ...course };
         delete courseWithoutProgress.progress_per_section_unit;
         delete courseWithoutProgress.completed_at;
         delete courseWithoutProgress.total_units;
         delete courseWithoutProgress.completed_units;

         const newRow = document.createElement("tr");

         for (const key in courseWithoutProgress) {
            switch (key) {
               case "course_id":
                  courseWithoutProgress.course_id = courseWithoutProgress.course_id.replace(
                     /(?:^|-)(\w)/g,
                     function (match, p1) {
                        return " " + p1.toUpperCase();
                     }
                  );
                  break;

               case "status":
                  courseWithoutProgress.status = courseWithoutProgress.status
                     .replace(/\bnot_started\b/g, "Não Iniciado")
                     .replace(/\bnot_completed\b/g, "Em Andamento")
                     .replace(/\bcompleted\b/g, "Finalizado");
                  break;

               case "time_on_course":
                  let seconds = courseWithoutProgress.time_on_course;
                  let hours = Math.floor(seconds / 3600);
                  let minutes = Math.floor((seconds % 3600) / 60);
                  let remainingSeconds = seconds % 60;

                  let formattedTime = "";

                  if (hours > 0) {
                     formattedTime += `${hours}:`;
                  }

                  if (minutes < 10) {
                     formattedTime += `0${minutes}:`;
                  } else {
                     formattedTime += `${minutes}:`;
                  }

                  if (remainingSeconds < 10) {
                     formattedTime += `0${remainingSeconds}`;
                  } else {
                     formattedTime += `${remainingSeconds}`;
                  }

                  courseWithoutProgress.time_on_course = formattedTime;
                  break;

               case "progress_rate":
                  courseWithoutProgress.progress_rate = `${courseWithoutProgress.progress_rate}%`;
                  break;
            }

            const cell = document.createElement("td");
            cell.textContent = courseWithoutProgress[key];
            newRow.appendChild(cell);
         }
         tableBody.appendChild(newRow);
      });
      userTable.appendChild(tableBody);
      userDiv.appendChild(userTable);
      userTitleDiv.appendChild(tableName);
      userTitleDiv.appendChild(completedCoursesCountText);
      userBiggerDiv.appendChild(userTitleDiv);
      userBiggerDiv.appendChild(userDiv);
      tablesContainer.appendChild(userBiggerDiv);
   });
   loadingIndicator.classList.add("hidden");
   showUserTable(activeTable);
}

function showUserTable(info) {
   if (typeof info == "number") {
      const userTables = document.querySelectorAll(".user-tables .userBiggerDiv");

      userTables.forEach((table, i) => {
         if (i === info) {
            table.classList.remove("hidden");
            info = table.dataset.username;
         } else {
            table.classList.add("hidden");
         }
      });
   } else {
      const userTables = document.querySelectorAll(".user-tables .userBiggerDiv");
      userTables.forEach((table) => {
         if (table.dataset.username === info) {
            table.classList.remove("hidden");
         } else {
            table.classList.add("hidden");
         }
      });
      document.querySelector(".userSelect").value = info;
   }
   document.querySelectorAll(".userRow").forEach((userRow) => {
      userRow.classList.remove("highlighted");
   });
   document.querySelector(`tr[data-username="${info}"]`).classList.add("highlighted");
   activeTable = info;
}

function orderByProgress() {
   userProgressData.forEach((user) => {
      user.data.sort((a, b) => b.progress_rate - a.progress_rate);
   });
   showReports();
   orderByProgressBtn.classList.add("selectedBtn");
   orderByTimeBtn.classList.remove("selectedBtn");
   orderByScoreBtn.classList.remove("selectedBtn");
}

function orderByTime() {
   userProgressData.forEach((user) => {
      user.data.sort((a, b) => b.time_on_course - a.time_on_course);
   });
   showReports();
   orderByProgressBtn.classList.remove("selectedBtn");
   orderByTimeBtn.classList.add("selectedBtn");
   orderByScoreBtn.classList.remove("selectedBtn");
}

function orderByScore() {
   userProgressData.forEach((user) => {
      user.data.sort((a, b) => b.average_score_rate - a.average_score_rate);
   });
   showReports();
   orderByProgressBtn.classList.remove("selectedBtn");
   orderByTimeBtn.classList.remove("selectedBtn");
   orderByScoreBtn.classList.add("selectedBtn");
}

function filterByStatus(selectedOption) {
   userProgressData = JSON.parse(JSON.stringify(userProgressDataFromAPI));
   userProgressData.forEach((user) => {
      const filteredUserProgressData = user.data.filter((item) => item.status === selectedOption);
      user.data = filteredUserProgressData;
      showReports();
      filterByStatusBtn.classList.add("selectedBtn");
   });
}

function removeFilter() {
   userProgressData = JSON.parse(JSON.stringify(userProgressDataFromAPI));
   showReports();
   filterByStatusBtn.classList.remove("selectedBtn");
}

function showHiddenElements() {
   const elements = document.querySelectorAll(".showWhenLoaded");
   elements.forEach((element) => {
      element.classList.remove("hidden");
   });
}

function filterByDate() {
   const minDate = document.getElementById("minDate").dataset.unixtime;
   const maxDate = document.getElementById("maxDate").dataset.unixtime;

   progressRanking = progressRanking.map((user) => {
      let filteredCompletedCoursesInfo = user.completed_courses_info.filter((activity) => {
         if (activity.created >= minDate && activity.created <= maxDate) {
         } else {
         }
         return activity.created >= minDate && activity.created <= maxDate;
      });
      user.completed_courses = filteredCompletedCoursesInfo.length;
      return user;
   });
   showRanking(false);
}

function removeDateFilter() {
   filterByDateBtn.classList.remove("selectedBtn");
   const minDateField = document.getElementById("minDate");
   minDateField.dataset.unixtime = 1;
   minDateField.value = "";
   const maxDateField = document.getElementById("maxDate");
   maxDateField.dataset.unixtime = 99999999999999999999999;
   maxDateField.value = "";

   filterByDate();
}

function createOrderIcon() {
   const icon = document.createElement("img");
   icon.src = `./ordenacao.png`;
   icon.classList.add("orderIcon");
   return icon;
}
await adminInfoManagement().then(() => {
   generateDashboard();
});
