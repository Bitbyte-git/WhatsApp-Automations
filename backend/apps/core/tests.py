from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.authentication.models import User
from apps.clients.models import Client
from apps.whatsapp.models import WhatsAppAccount
from apps.inbox.models import Contact, Conversation, Message
from apps.billing.models import Wallet

class BitByteSaaSTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create Superadmin
        self.superadmin = User.objects.create_superuser(
            email='admin@bitbytetech.org',
            password='Password@123',
            full_name='Super Admin'
        )

        # Create Client 1 (Tenant 1)
        self.tenant1 = Client.objects.create(
            name='Alpha Corp',
            company_email='alpha@corp.com',
            phone_number='+919111111111'
        )
        self.wallet1 = Wallet.objects.create(client=self.tenant1, balance=500.0)
        self.user1 = User.objects.create_user(
            email='user1@alpha.com',
            password='Password@123',
            full_name='Alpha User',
            role='CLIENT_ADMIN',
            client=self.tenant1
        )

        # Create Client 2 (Tenant 2)
        self.tenant2 = Client.objects.create(
            name='Beta Retail',
            company_email='beta@retail.com',
            phone_number='+919222222222'
        )
        self.wallet2 = Wallet.objects.create(client=self.tenant2, balance=200.0)
        self.user2 = User.objects.create_user(
            email='user2@beta.com',
            password='Password@123',
            full_name='Beta User',
            role='CLIENT_ADMIN',
            client=self.tenant2
        )

        # Create contacts for Tenant 1 and 2
        self.contact1 = Contact.objects.create(
            client=self.tenant1,
            phone_number='+919876500001',
            name='Customer One'
        )
        self.contact2 = Contact.objects.create(
            client=self.tenant2,
            phone_number='+919876500002',
            name='Customer Two'
        )

    def test_authentication_login(self):
        resp = self.client.post('/api/auth/login/', {
            'email': 'admin@bitbytetech.org',
            'password': 'Password@123'
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', resp.data)
        self.assertIn('access', resp.data['tokens'])

    def test_tenant_isolation_contacts(self):
        # User 1 logs in
        login_resp = self.client.post('/api/auth/login/', {
            'email': 'user1@alpha.com',
            'password': 'Password@123'
        })
        token = login_resp.data['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # User 1 fetches contacts
        resp = self.client.get('/api/inbox/contacts/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Should only see Tenant 1's contact, NEVER Tenant 2's contact
        contact_phones = [c['phone_number'] for c in resp.data['results']]
        self.assertIn(self.contact1.phone_number, contact_phones)
        self.assertNotIn(self.contact2.phone_number, contact_phones)

    def test_overview_analytics_real_data(self):
        # Superadmin overview
        self.client.force_authenticate(user=self.superadmin)
        resp = self.client.get('/api/analytics/overview/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['total_clients'], 2)
        self.assertEqual(resp.data['total_wallet_balance'], 700.0)
        self.assertEqual(resp.data['total_messages_sent'], 0)

    def test_meta_config_status_reports_unconfigured(self):
        self.client.force_authenticate(user=self.superadmin)
        resp = self.client.get('/api/whatsapp/status/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('status_message', resp.data)
