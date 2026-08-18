# Guia de Integração de Pagamento - Frontend

## 📋 Resumo da Implementação

Implementei a integração completa da requisição POST para o endpoint de pagamento do backend em `http://localhost:8080/payment/checkout`.

## 🏗️ Estrutura dos Arquivos

### Arquivos Modificados:
1. **checkout.html** - Adicionado script para carregar o payment-service.js
2. **checkout/js/index.js** - Integração do PaymentService para processar pagamentos

### Arquivos Criados:
1. **checkout/js/payment-service.js** - Serviço centralizado para requisições de pagamento

## 🔄 Fluxo de Funcionamento

### 1. Seleção do Método de Pagamento
O usuário seleciona um dos 4 métodos:
- `CARD` - Um cartão
- `TWO_CARDS` - Dois cartões
- `VOUCHER` - Apenas cupom
- `VOUCHER_CARD` - Cartão + Cupom

### 2. Validação de Dados
O formulário valida:
- Cartões selecionados (quando aplicável)
- Códigos de cupom (quando aplicável)
- Endereço de entrega
- Percentual de divisão (para 2 cartões)

### 3. Construção do Payload
O PaymentService constrói o payload conforme o método:

#### Exemplo 1: Pagamento com 1 Cartão
```json
{
  "typePayment": "CARD",
  "numberCardOne": "card_id_123",
  "amountCardOne": 150.50
}
```

#### Exemplo 2: Pagamento com 2 Cartões
Compra: R$ 100,00 | Cartão 1: 30% | Cartão 2: 70%
```json
{
  "typePayment": "TWO_CARDS",
  "numberCardOne": "card_id_1",
  "amountCardOne": 30.00,
  "numberCardTwo": "card_id_2",
  "amountCardTwo": 70.00
}
```

#### Exemplo 3: Pagamento com Cupom
```json
{
  "typePayment": "VOUCHER",
  "voucherId": "CUPOM123"
}
```

#### Exemplo 4: Pagamento com Cartão + Cupom
```json
{
  "typePayment": "VOUCHER_CARD",
  "numberCardOne": "card_id_456",
  "amountCardOne": 150.50,
  "voucherId": "CUPOM123"
}
```

### 4. Requisição POST
A requisição é enviada com:
- **URL**: http://localhost:8080/payment/checkout
- **Método**: POST
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer {token}`
- **Body**: Payload JSON com a DTO PaymentDetails

### 5. Tratamento de Resposta
- ✅ **Sucesso**: Exibe mensagem de sucesso e desabilita o botão
- ❌ **Erro**: Exibe mensagem de erro e re-habilita o botão para nova tentativa

## 📝 Detalhes Técnicos

### DTO PaymentDetails (Backend)
```java
public record PaymentDetails(
    TypePayment typePayment,      // OBRIGATÓRIO
    String numberCardOne,          // Para CARD, TWO_CARDS, VOUCHER_CARD
    BigDecimal amountCardOne,      // Valor a pagar no primeiro cartão
    String numberCardTwo,          // Para TWO_CARDS
    BigDecimal amountCardTwo,      // Valor a pagar no segundo cartão
    String voucherId               // Para VOUCHER, VOUCHER_CARD
) {}
```

### Cálculo de Valores (Para 2 Cartões)
```javascript
const percentage = parseInt(percentageInput.value);
const paymentCard1 = parseFloat((totalAmount * (100 - percentage) / 100).toFixed(2));
const paymentCard2 = parseFloat((totalAmount - paymentCard1).toFixed(2));
```

Isso garante que: `paymentCard1 + paymentCard2 = totalAmount`

## 🔐 Autenticação

A requisição utiliza o token JWT armazenado em `localStorage.getItem('token')`. 
Se o token não estiver disponível, uma exceção será lançada.

## 🐛 Debug e Logs

Abra o console do navegador (F12) para ver:
- Payload enviado: `console.log('Enviando payload para backend:', payload)`
- Resposta do servidor: `console.log('Resposta do servidor:', result)`
- Erros: `console.error('Erro na requisição de pagamento:', error)`

## 🔄 Fluxo Completo de Código

```
checkout.html (carrega scripts)
    ↓
checkout/js/payment-service.js (define PaymentService)
    ↓
checkout/js/index.js (inicializa formulário)
    ↓
Usuário clica em "Pagar"
    ↓
PaymentService.processPayment() executado
    ↓
buildPaymentPayload() - constrói DTO
    ↓
submitPaymentRequest() - faz POST para backend
    ↓
Resposta tratada (sucesso ou erro)
```

## ⚙️ Possíveis Ajustes Futuros

### 1. Validação do Cartão no Backend
Se o backend precisar do número completo do cartão (não apenas o ID), atualize a função `buildPaymentPayload()` para buscar os dados do cartão via API antes de enviar.

### 2. Handling de Respostas Específicas
Se o backend retornar códigos de erro específicos, adicione tratamento customizado no `submitPaymentRequest()`.

### 3. Integração com Gateway de Pagamento
Se precisar tokenizar os dados do cartão (ex: Stripe, PagSeguro), implemente no backend e atualize o payload conforme necessário.

### 4. Salvar Endereço
Caso queira salvar um novo endereço junto com o pagamento, o backend pode ter um endpoint separado ou integrado. Ajuste conforme necessário.

## 📞 Suporte

Se encontrar problemas:
1. Verifique se o backend está rodando em `http://localhost:8080`
2. Verifique o token no localStorage (`F12 > Application > LocalStorage`)
3. Verifique os logs do console para mais detalhes
4. Valide o JSON do payload contra a DTO do backend
