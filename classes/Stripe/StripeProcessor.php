<?php

use Stripe\Stripe;
use Stripe\Exception\CardException;
use Stripe\Exception\RateLimitException;
use Stripe\Exception\InvalidRequestException;
use Stripe\Exception\AuthenticationException;
use Stripe\Exception\ApiConnectionException;
use Stripe\Exception\ApiErrorException;

class StripeProcessor
{
    private string $secretKey;

    public function __construct(string $secretKey)
    {
        $this->secretKey = $secretKey;
        Stripe::setApiKey($this->secretKey);
    }

    private function translateErrorMessage(string $message): string
    {
        $translations = [
            "Your card was declined." => "Votre carte a été refusée.",
            "Your card number is incorrect." => "Le numéro de votre carte est incorrect.",
            "Your card's expiration month is invalid." => "Le mois d'expiration de votre carte est invalide.",
            "Your card's expiration year is invalid." => "L'année d'expiration de votre carte est invalide.",
            "Your card's security code is invalid." => "Le code de sécurité de votre carte est invalide.",
            "The card has expired." => "La carte a expiré.",
            "Your card does not support this type of purchase." => "Votre carte ne prend pas en charge ce type d'achat.",
            "Your card has insufficient funds." => "Fonds insuffisants sur votre carte.",
            "The card was declined due to a generic decline." => "Votre carte a été refusée (motif générique).",
            "This card is not supported." => "Cette carte n'est pas prise en charge.",
            "There was an error processing your card." => "Une erreur est survenue lors du traitement de votre carte.",
            "Your card number is incomplete." => "Le numéro de votre carte est incomplet.",
            "Your card's security code is required." => "Le code de sécurité de votre carte est requis.",
            "Your card's expiration date is incomplete." => "La date d'expiration de votre carte est incomplète.",
            "Your card was declined due to a suspected fraud." => "Votre carte a été refusée suite à une suspicion de fraude.",
            "Too many requests." => "Trop de requêtes. Veuillez réessayer plus tard.",
            "Authentication with Stripe API failed." => "Erreur d'authentification Stripe. Vérifiez votre clé API secrète.",
            "Could not connect to Stripe." => "Erreur de connexion à Stripe. Vérifiez votre connexion internet ou le statut de Stripe.",
            "An unexpected error occurred." => "Une erreur inattendue est survenue.",
            "Your card was declined for making repeated attempts too frequently or exceeding its amount limit." => "Votre carte a été refusée suite à des tentatives répétées trop fréquentes ou au dépassement de sa limite de montant.",
        ];

        return $translations[$message] ?? $message;
    }

private function getOrCreateCustomer(string $email, string $token, array $metadata = [])
{
    $customers = \Stripe\Customer::all(['email' => $email, 'limit' => 1]);

    if (!empty($customers->data)) {
        $customer = $customers->data[0];

        \Stripe\Customer::update($customer->id, [
            'source' => $token
        ]);

        return $customer;
    }

    return \Stripe\Customer::create([
        'email' => $email,
        'source' => $token,
        'metadata' => $metadata,
    ]);
}

    public function processPayment(
        string $token,
        int $amountInCents,
        string $currency,
        string $description,
        array $metadata,
        string $email
    ): array {
        try {
            $customer = $this->getOrCreateCustomer($email, $token, $metadata);

            $charge = \Stripe\Charge::create([
                'amount' => $amountInCents,
                'currency' => $currency,
                'description' => $description,
                'customer' => $customer->id,
                'metadata' => $metadata,
            ]);

            if ($charge->status === 'succeeded') {
                return [
                    'success' => true,
                    'message' => 'Paiement traité avec succès !',
                    'chargeId' => $charge->id,
                    'customerId' => $customer->id
                ];
            } else {
                return [
                    'success' => false,
                    'message' => $this->translateErrorMessage('Le paiement a échoué. Statut: ' . $charge->status)
                ];
            }
        } catch (CardException $e) {
            return ['success' => false, 'message' => $this->translateErrorMessage($e->getError()->message)];
        } catch (RateLimitException $e) {
            return ['success' => false, 'message' => $this->translateErrorMessage('Too many requests.')];
        } catch (InvalidRequestException $e) {
            return ['success' => false, 'message' => $this->translateErrorMessage($e->getError()->message)];
        } catch (AuthenticationException $e) {
            return ['success' => false, 'message' => $this->translateErrorMessage('Authentication with Stripe API failed.')];
        } catch (ApiConnectionException $e) {
            return ['success' => false, 'message' => $this->translateErrorMessage('Could not connect to Stripe.')];
        } catch (ApiErrorException $e) {
            return ['success' => false, 'message' => $this->translateErrorMessage($e->getError()->message)];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => $this->translateErrorMessage('An unexpected error occurred.') . ' ' . $e->getMessage()];
        }
    }
}






