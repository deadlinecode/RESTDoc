using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using S2S_TeamsApp.Source.Models.Requests;
using S2S_TeamsApp.Source.Handlers;
using System.IO;
using Newtonsoft.Json;
using S2S_TeamsApp.Source.JSON;
using S2S_TeamsApp.Source.Database;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Caching.Memory;

namespace S2S_TeamsApp.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class DataController : ControllerBase
    {
        private readonly DbMindmapContext _context;
        private readonly IConfiguration _config;
        private readonly IMemoryCache _cache;
        public DataController(DbMindmapContext context, IConfiguration config, IMemoryCache cache)
        {
            _context = context;
            _config = config;
            _cache = cache;
        }

        [HttpPost("getAllMindmaps")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetAll()
        {
            using (var reader = new StreamReader(Request.Body))
            {
                string body = await reader.ReadToEndAsync();

                var registerBodyObject = JsonConvert.DeserializeObject<RequestMindmapList>(body, new JsonSerializerSettings { ContractResolver = new JsonIgnoreAttributeIgnorerContractResolver() });

                return await Handler.HandleRequest<RequestMindmapList>(Request, _context, _config, _cache, Handler.HandleGetMindmapList, registerBodyObject);
            }
        }

        [HttpPost("getSingleMindmap")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetSingle()
        {
            using (var reader = new StreamReader(Request.Body))
            {
                string body = await reader.ReadToEndAsync();

                var registerBodyObject = JsonConvert.DeserializeObject<RequestMindmap>(body, new JsonSerializerSettings { ContractResolver = new JsonIgnoreAttributeIgnorerContractResolver() });

                return await Handler.HandleRequest<RequestMindmap>(Request, _context, _config, _cache, Handler.HandleGetMindmap, registerBodyObject);

            }

        }

        [HttpPost("addMindmap")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> PostMindmap()
        {
            using (var reader = new StreamReader(Request.Body))
            {
                string body = await reader.ReadToEndAsync();

                var registerBodyObject = JsonConvert.DeserializeObject<RegisterMindmap>(body, new JsonSerializerSettings { ContractResolver = new JsonIgnoreAttributeIgnorerContractResolver() });

                return await Handler.HandleRequest<RegisterMindmap>(Request, _context, _config, _cache, Handler.HandleAddMindmap, registerBodyObject);
            }
        }

        [HttpPost("tenant")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> PostTenant()
        {
            using (var reader = new StreamReader(Request.Body))
            {
                string body = await reader.ReadToEndAsync();

                var registerBodyObject = JsonConvert.DeserializeObject<RegisterTenant>(body, new JsonSerializerSettings { ContractResolver = new JsonIgnoreAttributeIgnorerContractResolver() });

                return await Handler.HandleRequest<RequestBase>(Request, _context, _config, _cache, Handler.HandleGetUserData, registerBodyObject);
            }
        }

        [HttpPost("deleteMindmap")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> deleteMindmap()
        {
            using (var reader = new StreamReader(Request.Body))
            {
                string body = await reader.ReadToEndAsync();

                var registerBodyObject = JsonConvert.DeserializeObject<RequestMindmap>(body, new JsonSerializerSettings { ContractResolver = new JsonIgnoreAttributeIgnorerContractResolver() });

                return await Handler.HandleRequest<RequestMindmap>(Request, _context, _config, _cache, Handler.HandleDeleteMindmap, registerBodyObject);
            }
        }

        [HttpPost("updateMindmap")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> updateMindmap()
        {
            using (var reader = new StreamReader(Request.Body))
            {
                string body = await reader.ReadToEndAsync();

                var registerBodyObject = JsonConvert.DeserializeObject<UpdateMindmap>(body, new JsonSerializerSettings { ContractResolver = new JsonIgnoreAttributeIgnorerContractResolver() });

                return await Handler.HandleRequest<UpdateMindmap>(Request, _context, _config, _cache, Handler.HandleUpdateMindmap, registerBodyObject);
            }
        }

        // RESTDOC_START
        // 
        // col = Charges Endpoints
        // title = Charge collectionawefawefawef
        // shortDesc = Generate a chargeawfawef
        // route = /v1/chargesaefw
        // method = GET
        // 
        // DESC_START
        // Use this endpoint to generate a chrage. This charge is payable through the Lightning Network or an on-chain bitcoin transaction.
        // Du kleiner Hurenoshn
        // DESC_END
        // 
        // BODY_START
        // id | number | Id of a post.
        // description | string | Charge description.
        // amount | number | Charge's price in satoshis, unless currency parameter is used.
        // currency | string | Charge's currency `USD/EUR/GBP/MXN/BRL/AUD`
        // order_id | string | External order ID (use your platform ID).
        // email | string | Customer's email.
        // name | string | Customer's name.
        // callback_url | string | URL to recieve webhooks `https://site.com/?handler=opennode`
        // success_url | string | URL to redirect the user after payment `https://site.com/order/abc123`
        // auto_settle | boolean | Indicates if this charge should be exchange to merchant's native currency.
        // BODY_END
        // 
        // HEADERS_START
        // Content-Type | application/json
        // Authorization | API-Key
        // Manuel | Hurensohn
        // HEADERS_END
        // 
        // RESTDOC_END
        [HttpPost("HasPermissions")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> hasPermission()
        {
            using (var reader = new StreamReader(Request.Body))
            {
                string body = await reader.ReadToEndAsync();

                var registerBodyObject = JsonConvert.DeserializeObject<PermissionRequestData>(body, new JsonSerializerSettings { ContractResolver = new JsonIgnoreAttributeIgnorerContractResolver() });

                registerBodyObject.MinPermissions = true;
                registerBodyObject.Scopes = _config.GetValue<string>("scopes");

                return await Handler.HandleRequest<PermissionRequestData>(Request, _context, _config, _cache, Handler.HandleHasPermissions, registerBodyObject);
            }
        }
        
        // RESTDOC_START
        // 
        // col = Charges Endpoints
        // title = Charge collection
        // shortDesc = Generate a charge
        // route = /v1/charges
        // method = POST
        // 
        // DESC_START
        // Use this endpoint to generate a chrage. This charge is payable through the Lightning Network or an on-chain bitcoin transaction.
        // DESC_END
        // 
        // BODY_START
        // id | number | Id of a post.
        // description | string | Charge description.
        // amount | number | Charge's price in satoshis, unless currency parameter is used.
        // currency | string | Charge's currency `USD/EUR/GBP/MXN/BRL/AUD`
        // order_id | string | External order ID (use your platform ID).
        // email | string | Customer's email.
        // name | string | Customer's name.
        // callback_url | string | URL to recieve webhooks `https://site.com/?handler=opennode`
        // success_url | string | URL to redirect the user after payment `https://site.com/order/abc123`
        // auto_settle | boolean | Indicates if this charge should be exchange to merchant's native currency.
        // BODY_END
        // 
        // HEADERS_START
        // Content-Type | application/json
        // Authorization | API-Key
        // HEADERS_END
        // 
        // RESTDOC_END
        [HttpPost("updateContent")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> updateContent()
        {
            using (var reader = new StreamReader(Request.Body))
            {
                string requestBody = await reader.ReadToEndAsync();
                var updateContentObject = JsonConvert.DeserializeObject<UpdateContent>(requestBody, new JsonSerializerSettings { ContractResolver = new JsonIgnoreAttributeIgnorerContractResolver() });



                return await Handler.HandleRequest<UpdateContent>(Request, _context, _config, _cache, Handler.HandleUpdateContent, updateContentObject);
            }
        }

    }
}
