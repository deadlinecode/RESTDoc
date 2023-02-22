using System.Diagnostics;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using Solutions2Share.Solutions.TeamsManager.Classes.Requests;
using System;
using Newtonsoft.Json;
using Solutions2Share.Solutions.TeamsManager.Helpers.JSON;
using Solutions2Share.Solutions.TeamsManager.Helpers.Handlers;
using Solutions2Share.Solutions.TeamsManager.Source.Classes.Requests;
using Solutions2Share.Solutions.TeamsManager.Helpers;
using Solutions2Share.Solutions.TeamsManager.Helpers.Database;
using Solutions2Share.Solutions.TeamsManager.API.Public;
using Solutions2Share.Solutions.TeamsManager.Classes.Models;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http.Cors;
using Chronic;
using System.IdentityModel.Tokens.Jwt;

namespace TeamsManager.API
{
    [EnableCors("*", "*", "*")]
    public class PublicApiController : ApiController
    {
        // RESTDOC_START
        // 
        // col = Teams
        // title = Create a team
        // route = /api/v1.0/teams
        // method = POST
        // 
        // DESC_START
        // Use this endpoint to create a team
        // DESC_END
        // 
        // BODY_START
        // ApproveDenyComment | string | A reason for the approval of the request
        // AppliedPolicy | number | Optional
        // BODY_END
        // 
        // HEADERS_START
        // Content-Type | application/json
        // Authorization | Bearer XXX
        // HEADERS_END
        // 
        // RESTDOC_END
        [HttpPost]
        [Route("api/v1.0/teams")]
        public async Task<HttpResponseMessage> CreateTeam()
        {
            try
            {
                string requestBody = Request.Content.ReadAsStringAsync().Result;
                var createTeamPublicAPIObject = JsonConvert.DeserializeObject<CreateTeamPublicAPI>(requestBody, new JsonSerializerSettings { ContractResolver = new JsonIgnoreAttributeIgnorerContractResolver() });
                var tenant = await DatabaseHelperTenant.GetTenant(APIHandler.getTenantFromToken(Request.Headers.Authorization.ToString()));
                var template = await DatabaseHelperTemplate.GetTemplate(tenant.Id, createTeamPublicAPIObject.TemplateId);
                var createTeamObject = ObjectBuilder.CreateTeamObjectPublicAPI(createTeamPublicAPIObject, template.Id, false);
                return await APIHandler.HandleAPIRequest<CreateTeam>(Request, Handler.HandleCreateTeam, createTeamObject);
            }
            catch (Exception e)
            {
                Debug.WriteLine(e.Message);
                return Request.CreateResponse(System.Net.HttpStatusCode.InternalServerError, e.Message);
            }
        }

        // RESTDOC_START
        // 
        // col = DEPRECATED
        // title = Get managed Teams
        // route = /CreateTeamDelegatedUnstable
        // method = POST
        // 
        // DESC_START
        // Use this endpoint to approve a given request
        // DESC_END
        // 
        // BODY_START
        // ApproveDenyComment | string | A reason for the approval of the request
        // AppliedPolicy | number | Optional
        // BODY_END
        // 
        // HEADERS_START
        // Content-Type | application/json
        // Authorization | Bearer XXX
        // HEADERS_END
        // 
        // RESTDOC_END
        [HttpPost]
        [Route("api/v1.0/CreateTeamDelegatedUnstable")]
        public async Task<HttpResponseMessage> CreateTeamDelegatedUnstable()
        {
            try
            {
                string requestBody = Request.Content.ReadAsStringAsync().Result;
                var createTeamPublicAPIObject = JsonConvert.DeserializeObject<CreateTeamPublicAPI>(requestBody, new JsonSerializerSettings { ContractResolver = new JsonIgnoreAttributeIgnorerContractResolver() });
                var tenant = await DatabaseHelperTenant.GetTenant(APIHandler.getTenantFromToken(Request.Headers.Authorization.ToString()));
                var template = await DatabaseHelperTemplate.GetTemplate(tenant.Id, createTeamPublicAPIObject.TemplateId);
                var createTeamObject = ObjectBuilder.CreateTeamObjectPublicAPI(createTeamPublicAPIObject, template.Id, true);
                return await APIHandler.HandleAPIRequest<CreateTeam>(Request, Handler.HandleCreateTeam, createTeamObject);
            }
            catch (Exception e)
            {
                Debug.WriteLine(e.Message);
                return Request.CreateResponse(System.Net.HttpStatusCode.InternalServerError, e.Message);
            }
        }

        // RESTDOC_START
        // 
        // col = Templates
        // title = Save a template
        // route = /api/v1.0/templates
        // method = POST
        // 
        // DESC_START
        // Use this endpoint to save a given team into a template
        // DESC_END
        // 
        // BODY_START
        // TeamId | string | The team, which will be used for the template
        // BODY_END
        // 
        // HEADERS_START
        // Content-Type | application/json
        // Authorization | Bearer XXX
        // HEADERS_END
        // 
        // RESTDOC_END
        [HttpPost]
        [Route("api/v1.0/templates")]
        public async Task<HttpResponseMessage> SaveTemplate()
        {
            try
            {
                string requestBody = Request.Content.ReadAsStringAsync().Result;
                var saveTemplateObject = JsonConvert.DeserializeObject<SaveTemplate>(requestBody, new JsonSerializerSettings { ContractResolver = new JsonIgnoreAttributeIgnorerContractResolver() });
                saveTemplateObject.IsApi = true;
                return await APIHandler.HandleAPIRequest<SaveTemplate>(Request, Handler.HandleSaveTemplate, saveTemplateObject);
            }
            catch (Exception e)
            {
                Debug.WriteLine(e.Message);
                return Request.CreateResponse(System.Net.HttpStatusCode.InternalServerError, e.Message);
            }
        }

        // RESTDOC_START
        // 
        // col = Requests
        // title = Get managed Teams
        // route = /api/v1.0/requests/{requestId}/approve
        // method = POST
        // 
        // DESC_START
        // Use this endpoint to approve a given request
        // DESC_END
        // 
        // BODY_START
        // ApproveDenyComment | string | A reason for the approval of the request
        // ?AppliedPolicy | number | The policy to be applied
        // BODY_END
        // 
        // HEADERS_START
        // Content-Type | application/json
        // Authorization | Bearer XXX
        // HEADERS_END
        // 
        // RESTDOC_END
        [HttpPost]
        [Route("api/v1.0/requests/{requestId}/approve")]
        public async Task<HttpResponseMessage> ApproveRequest(string requestId)
        {
            try
            {
                string requestBody = Request.Content.ReadAsStringAsync().Result;
                var createRequestObject = JsonConvert.DeserializeObject<ApproveRequest>(requestBody, new JsonSerializerSettings { ContractResolver = new JsonIgnoreAttributeIgnorerContractResolver() });
                createRequestObject.IsApi = true;
                return await APIHandler.HandleAPIRequest<ApproveRequest>(Request, Handler.HandleApproveRequest, createRequestObject);
            }
            catch (Exception e)
            {
                Debug.WriteLine(e.Message);
                return Request.CreateResponse(System.Net.HttpStatusCode.InternalServerError, e.Message);
            }
        }






        // RESTDOC_START
        // 
        // col = Teams
        // title = Update metadata of a team
        // route = /api/v1.0/teams/{teamId}/metadata
        // method = PATCH
        // 
        // DESC_START
        // Use this endpoint to update one or more field values of a given team
        // DESC_END
        // 
        // BODY_START
        // FieldId | number | The id of the field
        // Value | string | The value of the vield
        // BODY_END
        // 
        // HEADERS_START
        // Content-Type | application/json
        // Authorization | Bearer XXX
        // HEADERS_END
        // 
        // RSP_BODY_START
        // TeamId | string | 123-456789-1011121314
        // TeamUrl | string | asdf
        // MembersCount | int | 43
        // SharePointUrl | string | asdf
        // IconUrl | string | asdf
        // DisplayName | string | @My Cool Team
        // MailNickname | string | My_Cool_Team
        // Description | string | This is my super cool Team
        // Visibility | string | public
        // CreatedAt | datetime | 2023-17-01:10:55:00
        // RSP_BODY_END
        // 
        // RESTDOC_END
        [HttpPatch]
        [Route("api/v1.0/teams/{teamId}/metadata")]
        public async Task<HttpResponseMessage> UpdateTeamMetadata(string tenantId, string teamId)
        {
            try
            {
                string requestBody = Request.Content.ReadAsStringAsync().Result;
                List<FieldValues> fieldValues = JsonConvert.DeserializeObject<List<FieldValues>>(requestBody, new JsonSerializerSettings { ContractResolver = new JsonIgnoreAttributeIgnorerContractResolver() });
                var getIsTeamOwnerObject = new UpdateTeamMetadata
                {
                    TeamId = teamId,
                    FieldValues = fieldValues,
                    IsApi = true
                };

                return await APIHandler.HandleAPIRequest<UpdateTeamMetadata>(Request, Handler.HandleUpdateTeamMetadata, getIsTeamOwnerObject);
            }
            catch (Exception e)
            {
                Debug.WriteLine(e);
                return Request.CreateResponse(System.Net.HttpStatusCode.InternalServerError, e.Message);
            }
        }


        // RESTDOC_START
        // 
        // col = Teams
        // title = Get managed Teams
        // route = /api/v1.0/teams/{teamId}/metadata
        // method = GET
        // 
        // DESC_START
        // Use this endpoint to retrieve a list of all field values of a given teams
        // DESC_END
        // 
        // HEADERS_START
        // Content-Type | application/json
        // Authorization | Bearer XXX
        // HEADERS_END
        // 
        // RSP_BODY_START
        // TeamId | string | 123-456789-1011121314
        // TeamUrl | string | asdf
        // MembersCount | int | 43
        // SharePointUrl | string | asdf
        // IconUrl | string | asdf
        // DisplayName | string | @My Cool Team
        // MailNickname | string | My_Cool_Team
        // Description | string | This is my super cool Team
        // Visibility | string | public
        // CreatedAt | datetime | 2023-17-01:10:55:00
        // RSP_BODY_END
        // 
        // RESTDOC_END
        [HttpGet]
        [Route("api/v1.0/teams/{teamId}/metadata")]
        public async Task<HttpResponseMessage> GetTeamMetadata(string teamId)
        {
            try
            {
                string requestBody = Request.Content.ReadAsStringAsync().Result;
                var createTeamObject = JsonConvert.DeserializeObject<GetTeamMetadata>(requestBody, new JsonSerializerSettings { ContractResolver = new JsonIgnoreAttributeIgnorerContractResolver() });
                createTeamObject.IsApi = true;
                return await APIHandler.HandleAPIRequest<GetTeamMetadata>(Request, Handler.HandleGetTeamMetadata, createTeamObject);
            }
            catch (Exception e)
            {
                Debug.WriteLine(e.Message);
                return Request.CreateResponse(System.Net.HttpStatusCode.InternalServerError, e.Message);
            }
        }

        // RESTDOC_START
        // 
        // col = Teams
        // title = Get managed Teams
        // route = /api/v1.0/teams/managed
        // method = GET
        // 
        // DESC_START
        // Use this endpoint to retrieve a list of all managed teams that you are a member of
        // DESC_END
        // 
        // HEADERS_START
        // Content-Type | application/json
        // Authorization | Bearer XXX
        // HEADERS_END
        // 
        // RSP_BODY_START
        // TeamId | string | 123-456789-1011121314
        // TeamUrl | string | asdf
        // MembersCount | int | 43
        // SharePointUrl | string | asdf
        // IconUrl | string | asdf
        // DisplayName | string | @My Cool Team
        // MailNickname | string | My_Cool_Team
        // Description | string | This is my super cool Team
        // Visibility | string | public
        // CreatedAt | datetime | 2023-17-01:10:55:00
        // RSP_BODY_END
        // 
        // RESTDOC_END
        [HttpGet]
        [Route("api/v1.0/teams/managed")]
        public async Task<HttpResponseMessage> GetManagedTeams()
        {
            try
            {
                return await APIHandler.HandleAPIRequest<GetTeamsAPI>(Request, Handler.HandleGetManagedTeamsForAPI, new GetTeamsAPI { IsApi = true });
            }
            catch (Exception e)
            {
                Debug.WriteLine(e.Message);
                return Request.CreateResponse(System.Net.HttpStatusCode.InternalServerError, e.Message);
            }
        }

        // RESTDOC_START
        // 
        // col = Teams
        // title = Get managed Teams
        // route = /api/v1.0/teams/managed/all
        // method = GET
        // 
        // DESC_START
        // Use this endpoint to retrieve a list of all managed teams
        // DESC_END
        // 
        // HEADERS_START
        // Content-Type | application/json
        // Authorization | Bearer XXX
        // HEADERS_END
        // 
        // RSP_BODY_START
        // TeamId | string | 123-456789-1011121314
        // TeamUrl | string | asdf
        // MembersCount | int | 43
        // SharePointUrl | string | asdf
        // IconUrl | string | asdf
        // DisplayName | string | @My Cool Team
        // MailNickname | string | My_Cool_Team
        // Description | string | This is my super cool Team
        // Visibility | string | public
        // CreatedAt | datetime | 2023-17-01:10:55:00
        // RSP_BODY_END
        // 
        // RESTDOC_END
        [HttpGet]
        [Route("api/v1.0/teams/managed/all")]
        public async Task<HttpResponseMessage> GetAllManagedTeams()
        {
            try
            {
                string requestBody = Request.Content.ReadAsStringAsync().Result;
                return await APIHandler.HandleAPIRequest<GetTeamsAPI>(
                    Request,
                    Handler.HandleGetAllManagedTeamsAPI,
                    new GetTeamsAPI
                    {
                        IsApi = true,
                    }
                );
            }
            catch (Exception e)
            {
                Debug.WriteLine(e.Message);
                return Request.CreateResponse(System.Net.HttpStatusCode.InternalServerError, e.Message);
            }
        }

        // RESTDOC_START
        // 
        // col = Teams
        // title = Get archived teams
        // route = /api/v1.0/teams/archived
        // method = GET
        // 
        // DESC_START
        // Use this endpoint to retrieve a list of all archived teams
        // DESC_END
        // 
        // HEADERS_START
        // Content-Type | application/json
        // Authorization | Bearer XXX
        // HEADERS_END
        // 
        // RSP_BODY_START
        // TeamId | string | 123-456789-1011121314
        // TeamUrl | string | asdf
        // MembersCount | int | 43
        // SharePointUrl | string | asdf
        // IconUrl | string | asdf
        // DisplayName | string | @My Cool Team
        // MailNickname | string | My_Cool_Team
        // Description | string | This is my super cool Team
        // Visibility | string | public
        // CreatedAt | datetime | 2023-17-01:10:55:00
        // RSP_BODY_END
        // 
        // RESTDOC_END
        [HttpGet]
        [Route("api/v1.0/teams/archived")]
        public async Task<HttpResponseMessage> GetArchivedTeams()
        {
            try
            {
                return await APIHandler.HandleAPIRequest<RequestBase>(Request, Handler.HandleGetArchivedTeams, new RequestBase { IsApi = true });
            }
            catch (Exception e)
            {
                Debug.WriteLine(e.Message);
                return Request.CreateResponse(System.Net.HttpStatusCode.InternalServerError, e.Message);
            }
        }

        // RESTDOC_START
        // 
        // col = Metadata
        // title = Get metadata fields
        // route = /api/v1.0/metadata/fields
        // method = GET
        // 
        // DESC_START
        // Use this endpoint to retrieve a list of all metadata fields
        // DESC_END
        // 
        // 
        // HEADERS_START
        // Content-Type | application/json
        // Authorization | Bearer XXX
        // HEADERS_END
        // 
        // RSP_BODY_START
        // name | string | CoolField
        // id | number | 25
        // RSP_BODY_END
        // 
        // RSP_STATUS_START
        // 200 | OK
        // RSP_STATUS_END
        //
        // 
        // RESTDOC_END
        [HttpGet]
        [Route("api/v1.0/metadata/fields")]
        public async Task<HttpResponseMessage> GetMetadataFields()
        {
            try
            {
                return await APIHandler.HandleAPIRequest<RequestBase>(Request, Handler.HandleGetMetadataFields, new RequestBase { IsApi = true });
            }
            catch (Exception e)
            {
                Debug.WriteLine(e.Message);
                return Request.CreateResponse(System.Net.HttpStatusCode.InternalServerError, e.Message);
            }
        }

        [HttpPost]
        [Route("generateDocsAccessToken")]
        public async Task<HttpResponseMessage> GenerateAccessToken()
        {
            try
            {
                string requestBody = Request.Content.ReadAsStringAsync().Result;
                var body = JsonConvert.DeserializeObject<OAuthCode>(requestBody, new JsonSerializerSettings { ContractResolver = new JsonIgnoreAttributeIgnorerContractResolver() });

                HttpClient client = new HttpClient();
                var redirect_uri = "http://localhost:3000";
#if !DEBUG
                redirect_uri = System.Configuration.ConfigurationManager.AppSettings.Get("DocsAppRedirectUri");
#endif
                var content = new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    {
                        "client_id", System.Configuration.ConfigurationManager.AppSettings.Get("DocsAppClientId")
                    },
                    {
                        "client_secret", System.Configuration.ConfigurationManager.AppSettings.Get("DocsAppClientSecret")
                    },
                    {
                        "code", body.Code
                    },
                    {
                        "redirect_uri", redirect_uri
                    },
                    {
                        "grant_type", "authorization_code"
                    }
                });
                content.Headers.Clear();
                content.Headers.Add("Content-Type", "application/x-www-form-urlencoded");
                var AuthRsp = await (await client.PostAsync("https://login.microsoftonline.com/organizations/oauth2/v2.0/token", content)).Content.ReadAsStringAsync();
                var tenantId = new JwtSecurityTokenHandler().ReadJwtToken(JsonConvert.DeserializeObject<OAuthToken>(AuthRsp).access_token).Claims.First(claim => claim.Type == "tid").Value;
                if (await DatabaseHelperTenant.GetTenant(tenantId) == null)
                {
                    return Request.CreateResponse(System.Net.HttpStatusCode.NotFound, "TeamsManager is not installed on the specified tenant");
                }
                var rsp = Request.CreateResponse(System.Net.HttpStatusCode.OK, AuthRsp);
                rsp.Headers.Add("Access-Control-Allow-Origin", "*");
                rsp.Headers.Add("Access-Control-Allow-Headers", "*");
                rsp.Headers.Add("Access-Control-Allow-Credentials", "true");
                return rsp;
            }
            catch (Exception e)
            {
                Debug.WriteLine(e.Message);
                return Request.CreateResponse(System.Net.HttpStatusCode.InternalServerError, e.Message);
            }
        }
    }
}