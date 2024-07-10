let
    urlBase = "https://online.universidadedafarmacia.com.br",
    headers = [#"Lw-Client"="63cfd92085cf5d2cb507c4b2", Authorization="Bearer 5b2fZpcER0VklCo8pHTLTwMcyUu51vyoefNkBemZ"],

    // Função para fazer a chamada à API e retornar os resultados de uma página específica
    ObterUsuarios = (pagina) => Json.Document(Web.Contents(urlBase, [RelativePath = "/admin/api/v2/event-logs?activity=login&page=" & Text.From(pagina), Headers=headers])),

    todasAsPaginas = List.Generate(
        () => 1, // valor inicial
        each _ <= (ObterUsuarios(_)[meta][totalPages]), // condição de continuação
        each _ + 1, // incremento
        each _
    ),

    tabelasPorPagina = List.Transform(todasAsPaginas, (pagina) => Table.FromRecords(ObterUsuarios(pagina)[data])),

    tabelaResultante = Table.Combine(tabelasPorPagina), // Corrigido o argumento desta linha

    // Converter as colunas "created" e "last_login" de Unix para data e hora
    #"Data de Criação Convertida" = Table.TransformColumns(tabelaResultante, {
        {"created", each #datetime(1970, 1, 1, 0, 0, 0) + #duration(0, -3, 0, _), type datetime}
    }),
    #"user Expandido" = Table.ExpandRecordColumn(#"Data de Criação Convertida", "user", {"id", "username"}, {"user.id", "user.username"}),
    #"additional_info Expandido" = Table.ExpandRecordColumn(#"user Expandido", "additional_info", {"agent"}, {"additional_info.agent"}),
    #"additional_info.agent Expandido" = Table.ExpandRecordColumn(#"additional_info Expandido", "additional_info.agent", {"browser", "device", "languages", "platform", "robot", "ip", "referrer", "userAgent", "mobileApp", "deviceType", "operatingSystem", "deviceToken", "country", "region", "city", "location"}, {"additional_info.agent.browser", "additional_info.agent.device", "additional_info.agent.languages", "additional_info.agent.platform", "additional_info.agent.robot", "additional_info.agent.ip", "additional_info.agent.referrer", "additional_info.agent.userAgent", "additional_info.agent.mobileApp", "additional_info.agent.deviceType", "additional_info.agent.operatingSystem", "additional_info.agent.deviceToken", "additional_info.agent.country", "additional_info.agent.region", "additional_info.agent.city", "additional_info.agent.location"}),
    #"Colunas Removidas" = Table.RemoveColumns(#"additional_info.agent Expandido",{"activity", "type", "additional_info.agent.device", "additional_info.agent.languages", "additional_info.agent.robot", "additional_info.agent.ip", "additional_info.agent.referrer", "additional_info.agent.userAgent", "additional_info.agent.mobileApp", "additional_info.agent.deviceType", "additional_info.agent.operatingSystem", "additional_info.agent.deviceToken"}),
    #"additional_info.agent.location Expandido" = Table.ExpandRecordColumn(#"Colunas Removidas", "additional_info.agent.location", {"lng", "lat"}, {"additional_info.agent.location.lng", "additional_info.agent.location.lat"}),
    #"Colunas Removidas1" = Table.RemoveColumns(#"additional_info.agent.location Expandido",{"additional_info.agent.location.lng", "additional_info.agent.location.lat"}),
    #"Texto Inserido Antes do Delimitador" = Table.AddColumn(#"Colunas Removidas1", "Texto Antes do Delimitador", each Text.BeforeDelimiter([additional_info.agent.city], " ("), type text),
    #"Linhas Filtradas" = Table.SelectRows(#"Texto Inserido Antes do Delimitador", each true),
    #"Colunas Renomeadas" = Table.RenameColumns(#"Linhas Filtradas",{{"Texto Antes do Delimitador", "cidade"}}),
    #"Colunas Removidas2" = Table.RemoveColumns(#"Colunas Renomeadas",{"additional_info.agent.city"}),
    #"Colunas Renomeadas1" = Table.RenameColumns(#"Colunas Removidas2",{{"additional_info.agent.region", "estado"}}),
    #"Tipo Alterado" = Table.TransformColumnTypes(#"Colunas Renomeadas1",{{"estado", type text}}),
    #"Linhas Filtradas1" = Table.SelectRows(#"Tipo Alterado", each true),
    #"Tipo Alterado1" = Table.TransformColumnTypes(#"Linhas Filtradas1",{{"additional_info.agent.country", type text}}),
    #"Colunas Renomeadas2" = Table.RenameColumns(#"Tipo Alterado1",{{"additional_info.agent.platform", "sistema_operacional"}, {"additional_info.agent.browser", "navegador"}}),
    #"Tipo Alterado2" = Table.TransformColumnTypes(#"Colunas Renomeadas2",{{"sistema_operacional", type text}, {"navegador", type text}}),
    #"Colunas Renomeadas3" = Table.RenameColumns(#"Tipo Alterado2",{{"description", "atividade"}, {"created", "criado"}, {"user.username", "nome"}, {"user.id", "id"}}),
    #"Tipo Alterado3" = Table.TransformColumnTypes(#"Colunas Renomeadas3",{{"atividade", type text}}),
    #"Colunas Renomeadas4" = Table.RenameColumns(#"Tipo Alterado3",{{"additional_info.agent.country", "pais"}}),
    #"Personalização Adicionada" = Table.AddColumn(#"Colunas Renomeadas4", "Data_trrial", each if [atividade]="subscription_trial" then [criado] else null),
    #"Colunas Removidas3" = Table.RemoveColumns(#"Personalização Adicionada",{"Data_trrial"}),
    #"Linhas Classificadas" = Table.Sort(#"Colunas Removidas3",{{"criado", Order.Descending}}),
    #"Duplicatas Removidas" = Table.Distinct(#"Linhas Classificadas", {"id"}),
    #"Linhas Filtradas2" = Table.SelectRows(#"Duplicatas Removidas", each true),
    #"Valor Substituído" = Table.ReplaceValue(#"Linhas Filtradas2","á","a",Replacer.ReplaceText,{"estado"}),
    #"Valor Substituído1" = Table.ReplaceValue(#"Valor Substituído","ã","a",Replacer.ReplaceText,{"estado"}),
    #"Valor Substituído2" = Table.ReplaceValue(#"Valor Substituído1","í","i",Replacer.ReplaceText,{"estado"}),
    #"Valor Substituído3" = Table.ReplaceValue(#"Valor Substituído2","ô","o",Replacer.ReplaceText,{"estado"}),
    #"Valor Substituído4" = Table.ReplaceValue(#"Valor Substituído3","ó","o",Replacer.ReplaceText,{"estado"}),
    #"Valor Substituído5" = Table.ReplaceValue(#"Valor Substituído4","Federal District","Distrito Federal",Replacer.ReplaceText,{"estado"}),
    #"Tipo Alterado4" = Table.TransformColumnTypes(#"Valor Substituído5",{{"id", type text}, {"nome", type text}}),
    #"Linhas Classificadas1" = Table.Sort(#"Tipo Alterado4",{{"criado", Order.Descending}}),
    #"Linhas Filtradas3" = Table.SelectRows(#"Linhas Classificadas1", each true),
    #"Linhas Classificadas2" = Table.Sort(#"Linhas Filtradas3",{{"criado", Order.Descending}})
in
    #"Linhas Classificadas2"